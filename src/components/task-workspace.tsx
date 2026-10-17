"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Task } from "@/lib/tasks";

const PAGE_SIZE = 20;

type TaskPage = {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
};

type DialogState =
  | { mode: "create" }
  | { mode: "edit" | "delete"; task: Task }
  | null;

export default function TaskWorkspace({ initialTasks, initialTotal }: {
  initialTasks: Task[];
  initialTotal: number;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({
          q: query,
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        const response = await fetch(`/api/tasks?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load tasks.");
        const data = result as TaskPage;
        setTasks(data.tasks);
        setTotal(data.total);
        if (data.page !== page) setPage(data.page);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLoadError(cause instanceof Error ? cause.message : "Could not load tasks.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 220 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, query, refreshVersion]);

  function onSaved(task: Task, mode: "create" | "edit") {
    setDialog(null);
    if (mode === "create") {
      setQuery("");
      setPage(1);
    }
    setRefreshVersion((version) => version + 1);
    if (mode === "edit" && query) {
      setTasks((current) => current.map((item) => item.id === task.id ? task : item));
    }
  }

  function onDeleted() {
    setDialog(null);
    if (tasks.length === 1 && page > 1) setPage((current) => current - 1);
    else setRefreshVersion((version) => version + 1);
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstVisible = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(page * PAGE_SIZE, total);

  return (
    <section className="section-block task-workspace" id="task-list" aria-labelledby="task-list-heading">
      <div className="section-heading workspace-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2 id="task-list-heading">Your tasks <span className="task-count">{total}</span></h2>
        </div>
        <button className="button button-primary" type="button" onClick={() => setDialog({ mode: "create" })}>
          ＋ New task
        </button>
      </div>

      <label className="search-box workspace-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search titles and descriptions..."
          aria-label="Search tasks"
        />
        {query && (
          <button className="clear-search-button" type="button" onClick={() => setQuery("")}>
            Clear
          </button>
        )}
      </label>

      <div className="list-meta">
        <span>{query ? `${total} ${total === 1 ? "match" : "matches"}` : `${total} ${total === 1 ? "task" : "tasks"}`}</span>
        <span>{total ? `${firstVisible}–${lastVisible} · Newest first` : "Newest first"}</span>
      </div>

      {loadError && <p className="workspace-error" role="alert">{loadError}</p>}
      <div className={`task-list${loading ? " task-list-loading" : ""}`} aria-busy={loading}>
        {tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <span className="task-marker" aria-hidden="true"><span /></span>
            <div className="task-card-content">
              <h3>{task.title}</h3>
              {task.description && <p>{task.description}</p>}
              <div className="task-metadata">
                <span className={`priority-badge priority-${task.priority}`}>Priority {task.priority}</span>
                {task.dueDate && <span className="due-date">Due {formatDueDate(task.dueDate)}</span>}
              </div>
            </div>
            <div className="task-actions">
              <button className="icon-action" type="button" onClick={() => setDialog({ mode: "edit", task })} aria-label={`Edit ${task.title}`} title="Edit task">↗</button>
              <button className="icon-action delete-action" type="button" onClick={() => setDialog({ mode: "delete", task })} aria-label={`Delete ${task.title}`} title="Delete task">×</button>
            </div>
          </article>
        ))}
      </div>

      {!loading && !loadError && tasks.length === 0 && (
        <div className="empty-state list-empty">
          <span className="empty-icon">{query ? "⌕" : "✳"}</span>
          <h3>{query ? "No matching tasks" : "Nothing on your list yet"}</h3>
          <p>{query ? "Try a different search or clear it to see every task." : "Start with one thing you would like to get done."}</p>
          {query
            ? <button className="text-link text-button" type="button" onClick={() => setQuery("")}>Clear search</button>
            : <button className="text-link text-button" type="button" onClick={() => setDialog({ mode: "create" })}>Create your first task <span aria-hidden="true">→</span></button>}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="pagination" aria-label="Task list pages">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>← Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>Next →</button>
        </nav>
      )}

      {dialog && (
        <TaskDialog
          dialog={dialog}
          onClose={() => setDialog(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </section>
  );
}

function formatDueDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function TaskDialog({
  dialog,
  onClose,
  onSaved,
  onDeleted,
}: {
  dialog: Exclude<DialogState, null>;
  onClose: () => void;
  onSaved: (task: Task, mode: "create" | "edit") => void;
  onDeleted: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const isDelete = dialog.mode === "delete";
  const isEdit = dialog.mode === "edit";
  const task = dialog.mode === "create" ? undefined : dialog.task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState(String(task?.priority ?? 3));
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(isEdit ? `/api/tasks/${task!.id}` : "/api/tasks", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority: Number(priority), dueDate: dueDate || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save this task.");
      onSaved(result.task as Task, isEdit ? "edit" : "create");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this task.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    if (!task) return;
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Could not delete this task.");
      }
      onDeleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this task.");
      setSaving(false);
    }
  }

  const heading = isDelete ? "Delete this task?" : isEdit ? "Edit task" : "Create a task";

  return (
    <dialog
      className="task-dialog"
      ref={ref}
      aria-labelledby="task-dialog-heading"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> {isDelete ? "ONE LAST CHECK" : "A THOUGHT, CAPTURED"}</p>
          <h2 id="task-dialog-heading">{heading}</h2>
          <p>{isDelete ? "This will permanently remove the task from your list." : "Keep it simple. You can always make changes later."}</p>
        </div>
        <button className="dialog-close" type="button" onClick={onClose} disabled={saving} aria-label="Close dialog">×</button>
      </div>

      {isDelete ? (
        <>
          <div className="delete-preview"><span className="task-marker" aria-hidden="true"><span /></span><div><strong>{task?.title}</strong>{task?.description && <p>{task.description}</p>}</div></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions dialog-actions">
            <button className="button button-danger" type="button" onClick={removeTask} disabled={saving}>{saving ? "Deleting..." : "Delete task"}</button>
            <button className="button button-quiet" type="button" onClick={onClose} disabled={saving}>Keep task</button>
          </div>
        </>
      ) : (
        <form className="task-form dialog-form" onSubmit={submit}>
          <label className="field-label" htmlFor="dialog-title">Task title <span>Required</span></label>
          <input id="dialog-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required autoFocus placeholder="e.g. Send the project proposal" />
          <label className="field-label description-label" htmlFor="dialog-description">Description <span>Optional</span></label>
          <textarea id="dialog-description" name="description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={4} placeholder="Add a little more detail..." />
          <div className="optional-fields">
            <label className="optional-field" htmlFor="dialog-priority">
              <span className="field-label">Priority <span>Optional · 1 is highest</span></span>
              <select id="dialog-priority" name="priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="1">1 · Highest</option>
                <option value="2">2 · High</option>
                <option value="3">3 · Normal</option>
                <option value="4">4 · Low</option>
              </select>
            </label>
            <label className="optional-field" htmlFor="dialog-due-date">
              <span className="field-label">Due date <span>Optional</span></span>
              <input id="dialog-due-date" name="dueDate" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving..." : isEdit ? "Save changes" : "Create task"} <span aria-hidden="true">→</span></button>
            <button className="button button-quiet" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
