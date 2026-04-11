"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const { status } = useSession();

  useEffect(() => {
    let active = true;
    getProviders()
      .then((res) => {
        if (active) {
          setProviders(res as Record<string, { id: string; name: string }> | null);
        }
      })
      .catch(() => {
        if (active) {
          setProviders(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = "/dashboard";
    }
  }, [status]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false
    });
    if (res?.error) {
      setError("Invalid credentials.");
    } else if (res?.url) {
      window.location.href = res.url;
    }
  };

  return (
    <section className="section reveal">
      <h2>Sign In</h2>
      <form className="demo-panel" onSubmit={onSubmit}>
        <div className="demo-grid">
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
        </div>
        {error ? <div className="pill pill-bad">{error}</div> : null}
        {providers?.google ? (
          <div className="control-row">
            <button
              type="button"
              className="control-button secondary"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="demo-note">
            Google sign-in is optional and only appears when <span className="mono">GOOGLE_CLIENT_ID</span> and{" "}
            <span className="mono">GOOGLE_CLIENT_SECRET</span> are configured.
          </div>
        )}
        <div className="control-row">
          <button type="submit" className="control-button">
            Sign In
          </button>
          <a className="control-button secondary" href="/register">
            Create account
          </a>
        </div>
      </form>
    </section>
  );
}
