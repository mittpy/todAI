import { notFound } from "next/navigation";
import Link from "next/link";
import TaskForm from "@/components/task-form";
import { getTask } from "@/lib/tasks";

export const runtime = "nodejs";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const task = await getTask(id);
  if (!task) notFound();

  return (
    <div className="page-wrap form-page">
      <Link className="back-link" href="/tasks">← <span>Back to tasks</span></Link>
      <div className="form-heading"><div className="eyebrow"><span className="eyebrow-dot" /> MAKE IT YOURS</div><h1>Edit task</h1><p>A quick change can make the next step clearer.</p></div>
      <TaskForm mode="edit" task={task} />
    </div>
  );
}
