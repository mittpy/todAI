import Link from "next/link";
import { listTasks } from "@/lib/tasks";
import TaskRow from "@/components/task-row";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tasks = await listTasks("", 4);

  return (
    <div className="page-wrap">
      <div className="eyebrow"><span className="eyebrow-dot" /> YOUR DAY, AT A GLANCE</div>
      <section className="welcome">
        <div>
          <p className="welcome-date">A calmer way to get things done</p>
          <h1>Make space for<br /><span>what matters.</span></h1>
          <p className="welcome-copy">One small step at a time. Keep your thoughts clear<br className="desktop-break" /> and your next move close.</p>
          <Link className="button button-primary" href="/tasks/new">＋ Create a task</Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-sun" /><span className="art-star star-one">✳</span>
          <span className="art-star star-two">✦</span><span className="art-leaf">⌁</span>
        </div>
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">YOUR WORKSPACE</p><h2>Recently added</h2></div>
          <Link className="text-link" href="/tasks">View all <span aria-hidden="true">→</span></Link>
        </div>
        {tasks.length ? (
          <div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} />)}</div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">✳</span>
            <h3>A fresh page</h3>
            <p>Your task list is clear. Add a task when something comes to mind.</p>
            <Link className="text-link" href="/tasks/new">Create your first task <span aria-hidden="true">→</span></Link>
          </div>
        )}
      </section>
    </div>
  );
}
