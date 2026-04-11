"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLocale } from "./LocaleProvider";

export function UserMenu() {
  const { data: session } = useSession();
  const { t } = useLocale();

  if (!session?.user) {
    return (
      <div className="user-menu">
        <Link className="tab" href="/login">
          {t("signIn")}
        </Link>
        <Link className="tab" href="/register">
          {t("register")}
        </Link>
      </div>
    );
  }

  return (
    <div className="user-menu">
      <span className="user-pill">Signed in as {session.user.email}</span>
      <Link className="tab" href="/profile">
        {t("profile")}
      </Link>
      <button type="button" className="tab" onClick={() => signOut({ callbackUrl: "/" })}>
        {t("signOut")}
      </button>
    </div>
  );
}
