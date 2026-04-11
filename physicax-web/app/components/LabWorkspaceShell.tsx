"use client";

import { usePathname } from "next/navigation";
import { labs } from "../data/labs";
import { useLocale } from "./LocaleProvider";

export function LabWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  const lab = labs.find((item) => pathname.startsWith(item.href));
  const title = lab ? (locale === "fr" && lab.titleFr ? lab.titleFr : lab.title) : "Lab";
  const summary = lab?.summary ?? "Lab workspace";
  const focus = lab?.focus ?? [];

  return (
    <div className="lab-workspace">
      <div className="lab-workspace-main">
        <div className="lab-workspace-header">
          <div>
            <div className="lab-workspace-title">{title}</div>
            <div className="lab-workspace-subtitle">{summary}</div>
          </div>
          <div className="lab-workspace-meta">
            {focus.map((tag) => (
              <span key={tag} className="pill">{tag}</span>
            ))}
          </div>
        </div>
        <div className="lab-workspace-body">{children}</div>
      </div>
    </div>
  );
}
