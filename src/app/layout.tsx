import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "todAI — Make space for what matters",
  description: "A calm, focused place to organize your tasks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link className="brand" href="/">
              <span className="brand-mark">t.</span>
              <span>tod<span className="brand-ai">AI</span></span>
            </Link>
            <p className="nav-label">WORKSPACE</p>
            <nav className="main-nav" aria-label="Main navigation">
              <Link href="/" className="nav-link"><span aria-hidden="true">⌂</span> Overview</Link>
              <Link href="/tasks" className="nav-link"><span aria-hidden="true">▤</span> All tasks</Link>
            </nav>
            <div className="sidebar-note">
              <span className="note-sparkle">✳</span>
              <p>Little by little,<br />a little becomes a lot.</p>
            </div>
            <p className="sidebar-footer">A little more focused.</p>
          </aside>
          <div className="main-column">
            <header className="topbar">
              <span className="topbar-caption">YOUR PERSONAL WORKSPACE</span>
              <Link className="button button-quiet topbar-action" href="/#task-list">
                <span aria-hidden="true">▤</span> Tasks
              </Link>
            </header>
            <main className="page-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
