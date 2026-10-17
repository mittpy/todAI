import { mkdir } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";

export type Task = {
  id: number;
  title: string;
  description: string;
  priority: number;
  dueDate: string | null;
  completed: boolean;
};

export type TaskInput = {
  title: string;
  description: string;
  priority: number;
  dueDate: string | null;
};

type StoredTask = Omit<Task, "completed"> & { completed: number };

const TITLE_LIMIT = 200;
const DESCRIPTION_LIMIT = 5000;

let databasePromise: Promise<Database> | undefined;

function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const configuredPath = process.env.TASKS_DB_PATH;
      const filename = configuredPath
        ? path.resolve(/*turbopackIgnore: true*/ configuredPath)
        : path.join(process.cwd(), "data", "todai.sqlite");
      await mkdir(path.dirname(filename), { recursive: true });
      const db = await open({ filename, driver: sqlite3.Database });
      await db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA busy_timeout = 5000;
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND ${TITLE_LIMIT}),
          description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= ${DESCRIPTION_LIMIT}),
          priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 4),
          due_date TEXT DEFAULT NULL,
          completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1))
        );
      `);
      const columns = await db.all<{ name: string }[]>("PRAGMA table_info(tasks)");
      const columnNames = new Set(columns.map((column) => column.name));
      if (!columnNames.has("priority")) {
        await db.exec(
          "ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 4)",
        );
      }
      if (!columnNames.has("due_date")) {
        await db.exec("ALTER TABLE tasks ADD COLUMN due_date TEXT DEFAULT NULL");
      }
      if (!columnNames.has("completed")) {
        await db.exec(
          "ALTER TABLE tasks ADD COLUMN completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1))",
        );
      }
      return db;
    })();
  }
  return databasePromise;
}

export function validateTaskInput(value: unknown): TaskInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TaskValidationError("Provide a task with a title and description.");
  }

  const input = value as Record<string, unknown>;
  if (typeof input.title !== "string") {
    throw new TaskValidationError("A title is required.");
  }
  if (input.description !== undefined && typeof input.description !== "string") {
    throw new TaskValidationError("Description must be text.");
  }
  if (input.priority !== undefined && (
    typeof input.priority !== "number" ||
    !Number.isInteger(input.priority) ||
    input.priority < 1 ||
    input.priority > 4
  )) {
    throw new TaskValidationError("Priority must be an integer between 1 and 4.");
  }
  if (input.dueDate !== undefined && input.dueDate !== null && typeof input.dueDate !== "string") {
    throw new TaskValidationError("Due date must be a date or empty.");
  }

  const title = input.title.trim();
  const description = input.description === undefined ? "" : input.description.trim();
  const priority = input.priority === undefined ? 3 : input.priority;
  const dueDate = input.dueDate === undefined || input.dueDate === "" ? null : input.dueDate;
  if (!title) throw new TaskValidationError("A title is required.");
  if (title.length > TITLE_LIMIT) {
    throw new TaskValidationError(`Title must be ${TITLE_LIMIT} characters or fewer.`);
  }
  if (description.length > DESCRIPTION_LIMIT) {
    throw new TaskValidationError(`Description must be ${DESCRIPTION_LIMIT} characters or fewer.`);
  }
  if (dueDate !== null && !isValidDate(dueDate)) {
    throw new TaskValidationError("Due date must be a valid calendar date.");
  }

  return { title, description, priority, dueDate };
}

export class TaskValidationError extends Error {}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function listTasks(search = "", limit?: number, offset = 0): Promise<Task[]> {
  const db = await getDatabase();
  const query = search.trim();
  let rows: StoredTask[];
  if (!query) {
    if (limit !== undefined) {
      rows = await db.all<StoredTask[]>(
        "SELECT id, title, description, priority, due_date AS dueDate, completed FROM tasks ORDER BY id DESC LIMIT ? OFFSET ?",
        limit,
        offset,
      );
    } else {
      rows = await db.all<StoredTask[]>("SELECT id, title, description, priority, due_date AS dueDate, completed FROM tasks ORDER BY id DESC");
    }
  } else {
    const pattern = `%${escapeLike(query)}%`;
    if (limit !== undefined) {
      rows = await db.all<StoredTask[]>(
        "SELECT id, title, description, priority, due_date AS dueDate, completed FROM tasks WHERE title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' ORDER BY id DESC LIMIT ? OFFSET ?",
        pattern,
        pattern,
        limit,
        offset,
      );
    } else {
      rows = await db.all<StoredTask[]>(
        "SELECT id, title, description, priority, due_date AS dueDate, completed FROM tasks WHERE title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' ORDER BY id DESC",
        pattern,
        pattern,
      );
    }
  }
  return rows.map(({ completed, ...task }) => ({ ...task, completed: completed === 1 }));
}

export async function countTasks(search = ""): Promise<number> {
  const db = await getDatabase();
  const query = search.trim();
  const result = query
    ? await db.get<{ count: number }>(
        "SELECT COUNT(*) AS count FROM tasks WHERE title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\'",
        `%${escapeLike(query)}%`,
        `%${escapeLike(query)}%`,
      )
    : await db.get<{ count: number }>("SELECT COUNT(*) AS count FROM tasks");
  return result?.count ?? 0;
}

export async function getTask(id: number): Promise<Task | undefined> {
  const db = await getDatabase();
  const task = await db.get<StoredTask>(
    "SELECT id, title, description, priority, due_date AS dueDate, completed FROM tasks WHERE id = ?",
    id,
  );
  if (!task) return undefined;
  return { ...task, completed: task.completed === 1 };
}

export async function createTask(value: unknown): Promise<Task> {
  const task = validateTaskInput(value);
  const db = await getDatabase();
  const result = await db.run(
    "INSERT INTO tasks (title, description, priority, due_date) VALUES (?, ?, ?, ?)",
    task.title,
    task.description,
    task.priority,
    task.dueDate,
  );
  if (result.lastID === undefined) throw new Error("SQLite did not return the new task id.");
  return { id: result.lastID, ...task, completed: false };
}

export async function updateTask(id: number, value: unknown): Promise<Task | undefined> {
  const task = validateTaskInput(value);
  const db = await getDatabase();
  const existing = await getTask(id);
  if (!existing) return undefined;
  const result = await db.run(
    "UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ? WHERE id = ?",
    task.title,
    task.description,
    task.priority,
    task.dueDate,
    id,
  );
  if (!(result.changes ?? 0)) return undefined;
  return { id, ...task, completed: existing.completed };
}

export async function setTaskCompleted(id: number, completed: boolean): Promise<Task | undefined> {
  const db = await getDatabase();
  const result = await db.run("UPDATE tasks SET completed = ? WHERE id = ?", completed ? 1 : 0, id);
  if (!(result.changes ?? 0)) return undefined;
  return getTask(id);
}

export async function deleteTask(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.run("DELETE FROM tasks WHERE id = ?", id);
  return (result.changes ?? 0) > 0;
}
