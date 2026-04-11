import { prisma } from "../../lib/prisma";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.visibility !== "public") {
    return (
      <section className="section reveal">
        <h2>Profile unavailable</h2>
        <p>This profile is private or does not exist.</p>
      </section>
    );
  }
  const publications = await prisma.publication.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <section className="section reveal">
        <h2>{user.name ?? "PhysicaX Member"}</h2>
        <p>{user.bio ?? "Public PhysicaX profile."}</p>
        <div className="inline-kv">
          <span className="pill">Level: {user.level}</span>
          <span className="pill">Interests: {user.interests ?? "—"}</span>
        </div>
      </section>
      <section className="section reveal">
        <h2>Published Experiments</h2>
        <div className="result-grid">
          {publications.length === 0 ? <div className="demo-note">No public experiments yet.</div> : null}
          {publications.map((pub) => (
            <div key={pub.id} className="result-card">
              <div className="result-title">{pub.title}</div>
              <div className="result-summary">Model: {pub.model}</div>
              <div className="result-tags">{pub.tags ?? ""}</div>
              <div className="result-tags">{pub.createdAt.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
