"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { labs } from "../data/labs";
import { MathBlock } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

export function LabWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const lab = labs.find((item) => pathname.startsWith(item.href));
  const title = lab ? (locale === "fr" && lab.titleFr ? lab.titleFr : lab.title) : "Lab";
  const summary = lab?.summary ?? "Lab workspace";
  const focus = lab?.focus ?? [];
  const activeContext =
    lab?.contexts
      ?.filter((context) => !context.match || pathname.startsWith(context.match))
      .sort((left, right) => (right.match?.length ?? 0) - (left.match?.length ?? 0))[0] ?? lab?.modelContext;

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
        {activeContext ? (
          <div className="lab-context-shell">
            <div className="lab-context-top">
              <div>
                <div className="lab-context-eyebrow">{activeContext.eyebrow ?? "Model context"}</div>
                <h2 className="lab-context-title">{activeContext.title}</h2>
                <p className="lab-context-summary">{activeContext.summary}</p>
              </div>
              {activeContext.equation ? (
                <div className="lab-context-equation">
                  <MathBlock latex={activeContext.equation} />
                </div>
              ) : null}
            </div>
            <div className="lab-context-grid">
              {activeContext.units?.length ? (
                <div className="lab-context-card">
                  <h3>Units and scale</h3>
                  <ul className="lab-context-list">
                    {activeContext.units.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeContext.assumptions?.length ? (
                <div className="lab-context-card">
                  <h3>Assumptions</h3>
                  <ul className="lab-context-list">
                    {activeContext.assumptions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeContext.validationLimits?.length ? (
                <div className="lab-context-card">
                  <h3>Validation limits</h3>
                  <ul className="lab-context-list">
                    {activeContext.validationLimits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {activeContext.nextStep ? (
                <div className="lab-context-card">
                  <h3>Recommended escalation</h3>
                  <p className="lab-context-next">{activeContext.nextStep}</p>
                </div>
              ) : null}
            </div>
            {activeContext.links?.length ? (
              <div className="lab-context-links">
                {activeContext.links.map((link) => (
                  <Link
                    key={`${link.href}-${link.label}`}
                    className={
                      link.variant === "secondary"
                        ? "control-button secondary"
                        : link.variant === "chip"
                          ? "control-chip"
                          : "control-button"
                    }
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="lab-workspace-body">{children}</div>
      </div>
    </div>
  );
}
