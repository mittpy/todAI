import Link from "next/link";
import { countTasks, listTasks } from "@/lib/tasks";
import TaskRow from "@/components/task-row";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: rawPage = "1" } = await searchParams;
  const requestedPage = Number(rawPage);
  const total = await countTasks(q);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, pageCount)
    : 1;
  const tasks = await listTasks(q, PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const searchSuffix = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="page-wrap">
      <div className="eyebrow"><span className="eyebrow-dot" /> KEEP IT MOVING</div>
      <div className="page-title-row">
        <div><h1>Your tasks</h1><p className="page-subtitle">Everything on your mind, all in one place.</p></div>
        <Link className="button button-primary" href="/tasks/new">＋ New task</Link>
      </div>
      <form className="search-form" action="/tasks">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input type="search" name="q" defaultValue={q} placeholder="Search your tasks..." aria-label="Search tasks" />
        </label>
        {q && <Link className="clear-search" href="/tasks">Clear</Link>}
      </form>
      <div className="list-meta">
        <span>{q ? `${total} ${total === 1 ? "result" : "results"}` : `${total} ${total === 1 ? "task" : "tasks"}`}</span>
        <span>{q ? `for “${q}”` : "Newest first"}</span>
      </div>
      {tasks.length ? (
        <div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} />)}</div>
      ) : (
        <div className="empty-state list-empty">
          <span className="empty-icon">{q ? "⌕" : "✳"}</span>
          <h3>{q ? "No matching tasks" : "Nothing on your list yet"}</h3>
          <p>{q ? "Try another search or clear your filters." : "Start with one thing you would like to get done."}</p>
          {q ? <Link className="text-link" href="/tasks">Clear search</Link> : <Link className="button button-primary" href="/tasks/new">＋ Create a task</Link>}
        </div>
      )}
      {pageCount > 1 && (
        <nav className="pagination" aria-label="Task list pages">
          {page > 1 ? <Link href={`/tasks?page=${page - 1}${searchSuffix}`}>← Previous</Link> : <span />}
          <span>Page {page} of {pageCount}</span>
          {page < pageCount ? <Link href={`/tasks?page=${page + 1}${searchSuffix}`}>Next →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
