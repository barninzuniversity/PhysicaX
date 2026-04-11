"use client";

import { useEffect, useState } from "react";

type Preset = {
  id: string;
  title: string;
  payload: Record<string, unknown>;
  createdAt?: string;
};

export function PresetManager() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [title, setTitle] = useState("New preset");
  const [payload, setPayload] = useState('{"model":"ideal_gas","params":{"n":1,"t":300,"v":0.02}}');
  const [status, setStatus] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/presets");
      if (res.ok) {
        const data = await res.json();
        setPresets(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(payload);
    } catch {
      setStatus("Payload must be valid JSON.");
      return;
    }
    setStatus(null);
    const res = await fetch("/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, payload: parsed })
    });
    if (res.ok) {
      setTitle("New preset");
      setPayload('{"model":"ideal_gas","params":{"n":1,"t":300,"v":0.02}}');
      await load();
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/presets?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">Saved Presets</div>
      <div className="demo-grid">
        <label className="field">
          <span>Preset title</span>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
      </div>
      <label className="field" style={{ marginTop: "12px" }}>
        <span>Preset payload (JSON)</span>
        <textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={4} />
      </label>
      {status ? <div className="pill pill-bad">{status}</div> : null}
      <div className="control-row" style={{ marginTop: "8px" }}>
        <button type="button" className="control-button" onClick={save}>
          Save preset
        </button>
      </div>
      <div className="saved-runs">
        {presets.length === 0 ? <div className="demo-note">No presets saved yet.</div> : null}
        {presets.map((preset) => (
          <div key={preset.id} className="result-card">
            <div className="result-title">{preset.title}</div>
            <div className="result-summary">Payload: {JSON.stringify(preset.payload)}</div>
            <div className="result-tags">{preset.createdAt ? new Date(preset.createdAt).toLocaleString() : ""}</div>
            <button type="button" className="tab" onClick={() => remove(preset.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
