"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Publication = {
  id: string;
  title: string;
  model: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  notes?: string | null;
  tags?: string | null;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
};

export default function GalleryItemPage() {
  const params = useParams();
  const entryId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] ?? "" : String(raw);
  }, [params]);
  const [item, setItem] = useState<Publication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<{ id: string; content: string; authorName: string; createdAt: string }[]>([]);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/gallery/${entryId}`);
        if (!res.ok) {
          setError("Unable to load experiment.");
          return;
        }
        const data = await res.json();
        setItem(data);
        const commentRes = await fetch(`/api/gallery/${entryId}/comment`);
        if (commentRes.ok) {
          setComments(await commentRes.json());
        }
      } catch {
        setError("Unable to load experiment.");
      }
    };
    load();
  }, [entryId]);

  const forkExperiment = async () => {
    setNote(null);
    try {
      const res = await fetch(`/api/gallery/${entryId}/fork`, { method: "POST" });
      if (res.ok) {
        setNote("Forked into your experiments.");
      } else {
        setNote("Unable to fork.");
      }
    } catch {
      setNote("Unable to fork.");
    }
  };

  return (
    <>
      <section className="section reveal">
        <h2>Shared Experiment</h2>
        <p>Public experiment details.</p>
      </section>
      <section className="section reveal">
        {error ? <div className="pill pill-bad">{error}</div> : null}
        {!item && !error ? <div className="demo-note">Loading...</div> : null}
        {item ? (
          <div className="demo-panel">
            <div className="demo-title">{item.title}</div>
            <div className="result-summary">Model: {item.model}</div>
            <div className="result-summary">
              Inputs: {Object.entries(item.inputs).map(([key, value]) => `${key}=${value}`).join(", ")}
            </div>
            <div className="result-summary">
              Outputs: {Object.entries(item.outputs).map(([key, value]) => `${key}=${value}`).join(", ")}
            </div>
            {item.tags ? <div className="result-tags">Tags: {item.tags}</div> : null}
            {item.notes ? <div className="result-summary">Notes: {item.notes}</div> : null}
            <div className="result-tags">Likes: {item.likesCount ?? 0} | Comments: {item.commentsCount ?? comments.length}</div>
            {item.createdAt ? <div className="result-tags">{new Date(item.createdAt).toLocaleString()}</div> : null}
            <div className="control-row" style={{ marginTop: "8px" }}>
              <button type="button" className="control-button" onClick={forkExperiment}>
                Fork to my experiments
              </button>
              {note ? <span className="pill">{note}</span> : null}
            </div>
            <div className="saved-runs" style={{ marginTop: "12px" }}>
              <div className="demo-title">Comments</div>
              {comments.length === 0 ? <div className="demo-note">No comments yet.</div> : null}
              {comments.map((comment) => (
                <div key={comment.id} className="result-card">
                  <div className="result-summary">{comment.content}</div>
                  <div className="result-tags">{comment.authorName}</div>
                  <div className="result-tags">{new Date(comment.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
