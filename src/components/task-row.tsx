"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Task } from "@/lib/tasks";

export default function TaskRow({ task }: { task: Task }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function removeTask() {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Could not delete this task.");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this task.");
      setDeleting(false);
    }
  }

  return (
    <article className={`task-card${deleting ? " task-card-deleting" : ""}`}>
      <span className="task-marker" aria-hidden="true"><span /></span>
      <div className="task-card-content">
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
        {error && <p className="task-error" role="alert">{error}</p>}
      </div>
      <div className="task-actions">
        <Link className="icon-action" href={`/tasks/${task.id}/edit`} aria-label={`Edit ${task.title}`} title="Edit task">↗</Link>
        <button className="icon-action delete-action" type="button" onClick={removeTask} disabled={deleting} aria-label={`Delete ${task.title}`} title="Delete task">{deleting ? "…" : "×"}</button>
      </div>
    </article>
  );
}
