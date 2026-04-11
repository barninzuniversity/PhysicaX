"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = "/dashboard";
    }
  }, [status]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, language })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Registration failed.");
      return;
    }
    setSuccess("Account created. Signing you in...");
    const signInResult = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false
    });
    if (signInResult?.url) {
      window.location.href = signInResult.url;
    }
  };

  return (
    <section className="section reveal">
      <h2>Create Account</h2>
      <form className="demo-panel" onSubmit={onSubmit}>
        <div className="demo-grid">
          <label className="field">
            <span>Name</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <label className="field">
          <span>Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
        </label>
      </div>
        {error ? <div className="pill pill-bad">{error}</div> : null}
        {success ? <div className="pill pill-good">{success}</div> : null}
        <div className="control-row">
          <button type="submit" className="control-button">
            Create Account
          </button>
          <a className="control-button secondary" href="/login">
            Back to sign in
          </a>
        </div>
      </form>
    </section>
  );
}
