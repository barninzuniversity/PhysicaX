"use client";

import { useEffect, useMemo, useState } from "react";

type FeatureChecklistProps = {
  title: string;
  items: string[];
  description?: string;
  storageKey?: string;
};

function normalize(items: string[], values: boolean[]) {
  return items.map((_, index) => values[index] ?? false);
}

export function FeatureChecklist({ title, items, description, storageKey }: FeatureChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(() => normalize(items, []));

  useEffect(() => {
    if (!storageKey) {
      setChecked((prev) => normalize(items, prev));
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        setChecked(normalize(items, parsed));
        return;
      }
    } catch {
      // ignore storage errors
    }
    setChecked((prev) => normalize(items, prev));
  }, [items, storageKey]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // ignore storage errors
    }
  }, [checked, storageKey]);

  const completed = useMemo(() => checked.filter(Boolean).length, [checked]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{title}</div>
      {description ? <div className="demo-note">{description}</div> : null}
      <div className="checklist">
        {items.map((item, index) => (
          <label key={`${item}-${index}`} className="check-item">
            <input
              type="checkbox"
              checked={checked[index] ?? false}
              onChange={() =>
                setChecked((prev) => prev.map((value, idx) => (idx === index ? !value : value)))
              }
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
      <div className="check-progress">
        {completed}/{items.length} complete
      </div>
    </div>
  );
}
