"use client";

import { useEffect, useState } from "react";
import { labs } from "../data/labs";

type Profile = {
  name?: string | null;
  bio?: string | null;
  level?: string | null;
  language?: string | null;
  interests?: string | null;
  favoriteLabs?: string | null;
  visibility?: string | null;
  email?: string | null;
  id?: string | null;
};

export function ProfileSettings() {
  const [profile, setProfile] = useState<Profile>({});
  const [status, setStatus] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  const toggleFavorite = (labId: string) => {
    const current = (profile.favoriteLabs ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    if (current.includes(labId)) {
      update({ favoriteLabs: current.filter((item) => item !== labId).join(", ") });
    } else {
      update({ favoriteLabs: [...current, labId].join(", ") });
    }
  };

  const save = async () => {
    setStatus(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    if (res.ok) {
      setStatus("Profile updated.");
    } else {
      setStatus("Unable to save profile.");
    }
  };

  const favorites = (profile.favoriteLabs ?? "").split(",").map((item) => item.trim()).filter(Boolean);

  return (
    <div className="demo-panel">
      <div className="demo-title">Profile Settings</div>
      <div className="demo-grid">
        <label className="field">
          <span>Name</span>
          <input type="text" value={profile.name ?? ""} onChange={(event) => update({ name: event.target.value })} />
        </label>
        <label className="field">
          <span>Preferred level</span>
          <select value={profile.level ?? "student"} onChange={(event) => update({ level: event.target.value })}>
            <option value="beginner">Beginner</option>
            <option value="student">Student</option>
            <option value="advanced">Advanced</option>
            <option value="research">Research</option>
          </select>
        </label>
        <label className="field">
          <span>Language</span>
          <select value={profile.language ?? "en"} onChange={(event) => update({ language: event.target.value })}>
            <option value="en">English</option>
            <option value="fr">French</option>
          </select>
        </label>
        <label className="field">
          <span>Profile visibility</span>
          <select value={profile.visibility ?? "private"} onChange={(event) => update({ visibility: event.target.value })}>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
      </div>

      <label className="field" style={{ marginTop: "12px" }}>
        <span>Bio</span>
        <textarea value={profile.bio ?? ""} onChange={(event) => update({ bio: event.target.value })} rows={3} />
      </label>
      <label className="field" style={{ marginTop: "12px" }}>
        <span>Interests</span>
        <input type="text" value={profile.interests ?? ""} onChange={(event) => update({ interests: event.target.value })} />
      </label>

      <div className="demo-output">
        <div className="demo-note">Select favorite labs for quick access in the Lab Rail.</div>
        <div className="pill-grid">
          {labs.map((lab) => (
            <button
              key={lab.id}
              type="button"
              className={`pill ${favorites.includes(lab.id) ? "pill-active" : ""}`}
              onClick={() => toggleFavorite(lab.id)}
            >
              {lab.title}
            </button>
          ))}
        </div>
      </div>

      <div className="control-row" style={{ marginTop: "12px" }}>
        <button type="button" className="control-button" onClick={save}>
          Save profile
        </button>
        {status ? <span className="pill">{status}</span> : null}
        {profile.id ? <span className="pill">Public URL: /profile/{profile.id}</span> : null}
      </div>
    </div>
  );
}
