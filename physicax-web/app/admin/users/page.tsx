"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  language: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setMessage("Unable to load users.");
      return;
    }
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    if (status === "authenticated") {
      load();
    }
  }, [status]);

  const updateUser = async (id: string, patch: Partial<AdminUser>) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: patch.role, language: patch.language })
    });
    if (!res.ok) {
      setMessage("Update failed.");
      return;
    }
    const data = await res.json();
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, role: data.role ?? user.role, language: data.language ?? user.language } : user
      )
    );
  };

  if (status === "loading") {
    return <section className="section reveal">Loading...</section>;
  }

  if (!session?.user?.role || session.user.role !== "admin") {
    return (
      <section className="section reveal">
        <h2>Admin Access Required</h2>
        <p>You must be an admin to manage roles and locales.</p>
      </section>
    );
  }

  return (
    <>
      <section className="section reveal">
        <h2>Admin - User Roles + Locales</h2>
        <p>Assign roles and language preferences. First registered user is admin.</p>
        {message ? <div className="pill pill-bad">{message}</div> : null}
      </section>
      <section className="section reveal">
        <div className="demo-panel">
          <div className="demo-title">User Directory</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Locale</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.name ?? "--"}</td>
                    <td>
                      <select
                        value={user.role ?? "user"}
                        onChange={(event) => updateUser(user.id, { role: event.target.value })}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={user.language ?? "en"}
                        onChange={(event) => updateUser(user.id, { language: event.target.value })}
                      >
                        <option value="en">en</option>
                        <option value="fr">fr</option>
                      </select>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
