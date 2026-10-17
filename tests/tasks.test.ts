import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sqlite3 from "sqlite3";
import { test } from "node:test";
import { open } from "sqlite";

test("task persistence and validation", async (suite) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "todai-test-"));
  const filename = path.join(directory, "tasks.sqlite");
  process.env.TASKS_DB_PATH = filename;
  const legacyDatabase = await open({ filename, driver: sqlite3.Database });
  await legacyDatabase.exec(`
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );
  `);
  await legacyDatabase.run(
    "INSERT INTO tasks (title, description) VALUES (?, ?)",
    "First task",
    "Initial note",
  );
  await legacyDatabase.close();

  const tasks = await import("../src/lib/tasks");
  suite.after(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  const first = await tasks.getTask(1);
  assert.deepEqual(first, {
    id: 1,
    title: "First task",
    description: "Initial note",
    priority: 3,
    dueDate: null,
    completed: false,
  });

  await suite.test("creates tasks with required trimmed titles and optional descriptions", async () => {
    const created = await tasks.createTask({ title: "  Plan the week " });
    assert.deepEqual(created, {
      id: 2,
      title: "Plan the week",
      description: "",
      priority: 3,
      dueDate: null,
      completed: false,
    });
    assert.deepEqual(await tasks.getTask(created.id), created);
  });

  await suite.test("persists an explicitly selected priority and due date", async () => {
    const created = await tasks.createTask({
      title: "Prepare the release",
      priority: 1,
      dueDate: "2026-12-31",
      completed: false,
    });
    assert.equal(created.priority, 1);
    assert.equal(created.dueDate, "2026-12-31");
    assert.deepEqual(await tasks.getTask(created.id), created);
  });

  await suite.test("rejects empty titles and oversized values", () => {
    assert.throws(() => tasks.validateTaskInput({ title: "  " }), tasks.TaskValidationError);
    assert.throws(
      () => tasks.validateTaskInput({ title: "t".repeat(201) }),
      tasks.TaskValidationError,
    );
    assert.throws(
      () => tasks.validateTaskInput({ title: "valid", description: "d".repeat(5001) }),
      tasks.TaskValidationError,
    );
    for (const priority of [0, 5, 1.5, "1"]) {
      assert.throws(
        () => tasks.validateTaskInput({ title: "valid", priority }),
        tasks.TaskValidationError,
      );
    }
    for (const dueDate of ["2026-02-30", "12/31/2026", "2026-2-01"]) {
      assert.throws(
        () => tasks.validateTaskInput({ title: "valid", dueDate }),
        tasks.TaskValidationError,
      );
    }
    assert.equal(tasks.validateTaskInput({ title: "valid", dueDate: null }).dueDate, null);
    assert.equal(tasks.validateTaskInput({ title: "valid", dueDate: "" }).dueDate, null);
  });

  await suite.test("searches titles and descriptions literally", async () => {
    assert.deepEqual((await tasks.listTasks("week")).map((task) => task.title), ["Plan the week"]);
    assert.deepEqual((await tasks.listTasks("%")).map((task) => task.title), []);
    assert.deepEqual((await tasks.listTasks("", 1, 2)).map((task) => task.title), ["First task"]);
    assert.equal(await tasks.countTasks(), 3);
  });

  await suite.test("updates and deletes tasks, returning no match for missing ids", async () => {
    const changed = await tasks.updateTask(1, { title: "Updated", description: "Done" });
    assert.deepEqual(changed, {
      id: 1,
      title: "Updated",
      description: "Done",
      priority: 3,
      dueDate: null,
      completed: false,
    });
    const completed = await tasks.setTaskCompleted(1, true);
    assert.equal(completed?.completed, true);
    const editedCompletedTask = await tasks.updateTask(1, {
      title: "Updated after completion",
      description: "Done",
    });
    assert.equal(editedCompletedTask?.completed, true);
    const reopened = await tasks.setTaskCompleted(1, false);
    assert.equal(reopened?.completed, false);
    assert.equal(await tasks.setTaskCompleted(999, true), undefined);
    assert.equal(await tasks.updateTask(999, { title: "Missing" }), undefined);
    assert.equal(await tasks.deleteTask(1), true);
    assert.equal(await tasks.deleteTask(1), false);
  });
});
