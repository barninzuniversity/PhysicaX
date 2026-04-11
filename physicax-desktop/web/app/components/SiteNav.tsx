"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useLocale } from "./LocaleProvider";

export function SiteNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { t } = useLocale();

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") {
      return true;
    }
    if (href !== "/" && pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  const isAdmin = session?.user?.role === "admin";
  const groups = [
    {
      label: t("navCore"),
      meta: t("navCoreMeta"),
      links: [
        { href: "/", label: t("overview") },
        { href: "/labs", label: t("labs") },
        { href: "/dashboard", label: t("dashboard") },
        { href: "/gallery", label: t("gallery") },
        { href: "/cfd", label: t("cfd") }
      ]
    },
    {
      label: t("navBlueprint"),
      meta: t("navBlueprintMeta"),
      links: [
        { href: "/platform", label: t("platform") },
        { href: "/architecture", label: t("architecture") },
        { href: "/formulas", label: t("formulas") },
        { href: "/formulas/glossary", label: t("navGlossary") },
        { href: "/solvers", label: t("solvers") },
        { href: "/registry", label: t("registry") },
        { href: "/ui", label: t("ui") }
      ]
    },
    {
      label: t("navOps"),
      meta: t("navOpsMeta"),
      links: [
        { href: "/research", label: t("research") },
        { href: "/education", label: t("education") },
        { href: "/challenges", label: t("challenges") },
        { href: "/classrooms", label: t("classrooms") },
        { href: "/governance", label: t("governance") },
        { href: "/qa", label: t("qa") },
        { href: "/testing", label: t("testing") },
        { href: "/build", label: t("build") },
        { href: "/appendix", label: t("appendix") }
      ]
    }
  ];

  if (isAdmin) {
    groups.push({
      label: t("navAdmin"),
      meta: t("navAdminMeta"),
      links: [
        { href: "/admin/users", label: t("navUserRoles") }
      ]
    });
  }

  return (
    <nav className="site-nav">
      <div className="nav-grid">
        {groups.map((group) => (
          <div key={group.label} className="nav-section">
            <div className="nav-section-head">
              <span className="nav-section-title">{group.label}</span>
              <span className="nav-section-meta">{group.meta}</span>
            </div>
            <div className="nav-items">
              {group.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                >
                  <span>{item.label}</span>
                  <span className="nav-item-dot" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div className="nav-section nav-section-account">
          <div className="nav-section-head">
            <span className="nav-section-title">{t("account")}</span>
            <span className="nav-section-meta">{status === "authenticated" ? t("navSignedIn") : t("navAccess")}</span>
          </div>
          <div className="nav-items">
            {status === "authenticated" ? (
              <>
                <span className="nav-item active">{session?.user?.email ?? t("navSignedIn")}</span>
                <Link href="/profile" className={`nav-item ${isActive("/profile") ? "active" : ""}`}>
                  {t("profile")}
                </Link>
                <button type="button" className="nav-item" onClick={() => signOut({ callbackUrl: "/" })}>
                  {t("signOut")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={`nav-item ${isActive("/login") ? "active" : ""}`}>
                  {t("signIn")}
                </Link>
                <Link href="/register" className={`nav-item ${isActive("/register") ? "active" : ""}`}>
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
