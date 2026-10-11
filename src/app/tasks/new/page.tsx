import Link from "next/link";
import TaskForm from "@/components/task-form";

export default function NewTaskPage() {
  return (
    <div className="page-wrap form-page">
      <Link className="back-link" href="/tasks">← <span>Back to tasks</span></Link>
      <div className="form-heading"><div className="eyebrow"><span className="eyebrow-dot" /> A THOUGHT, CAPTURED</div><h1>Create a task</h1><p>Get it out of your head and into your day.</p></div>
      <TaskForm mode="create" />
    </div>
  );
}
