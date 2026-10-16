import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

test("task persistence and validation", async (suite) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "todai-test-"));
  process.env.TASKS_DB_PATH = path.join(directory, "tasks.sqlite");
  const tasks = await import("../src/lib/tasks");
  suite.after(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  const first = await tasks.createTask({ title: "First task", description: "Initial note" });
  assert.equal(first.id, 1);

  await suite.test("creates tasks with required trimmed titles and optional descriptions", async () => {
    const created = await tasks.createTask({ title: "  Plan the week " });
    assert.deepEqual(created, { id: 2, title: "Plan the week", description: "" });
    assert.equal((await tasks.getTask(created.id))?.title, "Plan the week");
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
  });

  await suite.test("searches titles and descriptions literally", async () => {
    assert.deepEqual((await tasks.listTasks("week")).map((task) => task.title), ["Plan the week"]);
    assert.deepEqual((await tasks.listTasks("%")).map((task) => task.title), []);
    assert.deepEqual((await tasks.listTasks("", 1, 1)).map((task) => task.title), ["First task"]);
    assert.equal(await tasks.countTasks(), 2);
  });

  await suite.test("updates and deletes tasks, returning no match for missing ids", async () => {
    const changed = await tasks.updateTask(1, { title: "Updated", description: "Done" });
    assert.deepEqual(changed, { id: 1, title: "Updated", description: "Done" });
    assert.equal(await tasks.updateTask(999, { title: "Missing" }), undefined);
    assert.equal(await tasks.deleteTask(1), true);
    assert.equal(await tasks.deleteTask(1), false);
  });
});
