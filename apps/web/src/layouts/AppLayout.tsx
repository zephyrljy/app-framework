import type { ReactNode } from "react";
import { House } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { routes, type Page } from "@/router/routes";

export function AppLayout({ children }: { children: ReactNode }) {
  const page = useLocation().pathname.slice(1) as Page;
  const navigate = useNavigate();
  const onPageChange = (nextPage: Page) => navigate(`/${nextPage}`);

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">A</span><b>App</b></div><p className="nav-label">工作台</p>
      <button className={`nav-item ${page === "home" ? "active" : ""}`} onClick={() => onPageChange("home")}><House/>{routes.home.title}</button>
    </aside>
    <main className="main-content"><header className="topbar"><span>工作台　/　<b>{routes[page].title}</b></span></header><div className="page-wrap">{children}</div></main>
  </div>;
}
