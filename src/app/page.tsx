import Link from "next/link";
import { countTasks, listTasks } from "@/lib/tasks";
import TaskWorkspace from "@/components/task-workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [tasks, total] = await Promise.all([listTasks("", 20), countTasks()]);

  return (
    <div className="page-wrap">
      <div className="eyebrow"><span className="eyebrow-dot" /> YOUR DAY, AT A GLANCE</div>
      <section className="welcome">
        <div>
          <p className="welcome-date">A calmer way to get things done</p>
          <h1>Make space for<br /><span>what matters.</span></h1>
          <p className="welcome-copy">One small step at a time. Keep your thoughts clear<br className="desktop-break" /> and your next move close.</p>
          <Link className="button button-primary" href="#task-list">Go to your tasks <span aria-hidden="true">↓</span></Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-sun" /><span className="art-star star-one">✳</span>
          <span className="art-star star-two">✦</span><span className="art-leaf">⌁</span>
        </div>
      </section>
      <TaskWorkspace initialTasks={tasks} initialTotal={total} />
    </div>
  );
}
