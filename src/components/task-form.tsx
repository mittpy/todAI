"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Task } from "@/lib/tasks";

export default function TaskForm({ mode, task }: { mode: "create" | "edit"; task?: Task }) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(mode === "create" ? "/api/tasks" : `/api/tasks/${task!.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save this task.");
      router.push("/tasks");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <label className="field-label" htmlFor="title">Task title <span>Required</span></label>
      <input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required autoFocus placeholder="e.g. Send the project proposal" />
      <label className="field-label description-label" htmlFor="description">Description <span>Optional</span></label>
      <textarea id="description" name="description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={5} placeholder="Add a little more detail..." />
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving..." : mode === "create" ? "Create task" : "Save changes"} <span aria-hidden="true">→</span></button>
        <button className="button button-quiet" type="button" onClick={() => router.back()} disabled={saving}>Cancel</button>
      </div>
      <p className="form-footnote">A clear title is all it takes to get started.</p>
    </form>
  );
}
