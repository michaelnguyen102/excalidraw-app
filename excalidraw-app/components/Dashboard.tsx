import { useEffect, useState } from "react";
import { listDiagrams, createDiagram, deleteDiagram, renameDiagram, type DiagramDoc } from "../data/diagrams";
import { useAuth } from "./Auth";

type Props = {
  onOpen: (id: string) => void;
  onBack: () => void;
};

export const Dashboard = ({ onOpen, onBack }: Props) => {
  const { user, loading: authLoading } = useAuth();
  const [diagrams, setDiagrams] = useState<DiagramDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) {
      setDiagrams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await listDiagrams(user.uid);
      setDiagrams(list);
    } catch (e: any) {
      console.error(e);
      // If index missing, Firestore throws. Show empty with hint.
      if (e?.message?.includes("index")) {
        alert("Firestore needs an index for diagrams (ownerId + updatedAt). Click the link in console to create it, then refresh.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.uid, authLoading]);

  const handleCreate = async () => {
    if (!user) {
      alert("Please sign in first");
      return;
    }
    setBusy(true);
    try {
      const id = await createDiagram(user.uid, newName.trim() || "Untitled");
      setNewName("");
      const list = await listDiagrams(user.uid);
      setDiagrams(list);
      onOpen(id);
    } catch (e: any) {
      alert(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>My Diagrams</h1>
        <p style={{ marginTop: 12, opacity: 0.7 }}>Loading…</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>My Diagrams</h1>
        <p style={{ marginTop: 12, opacity: 0.7 }}>Sign in with Google to create, store and retrieve multiple diagrams. Your drawings are stored in Firestore under your user ID.</p>
        <p style={{ marginTop: 8, fontSize: 13, opacity: 0.6 }}>Click "Sign in with Google" at the top right, then return here.</p>
        <button onClick={onBack} style={{ marginTop: 24, padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>← Back to editor</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>My Diagrams</h1>
        <button onClick={onBack} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>← Back to editor</button>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New diagram name…"
          style={{ flex: 1, minWidth: 220, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button onClick={handleCreate} disabled={busy} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#6965db", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          {busy ? "Creating…" : "+ New diagram"}
        </button>
      </div>

      {loading ? (
        <p style={{ marginTop: 24, opacity: 0.6 }}>Loading…</p>
      ) : diagrams.length === 0 ? (
        <p style={{ marginTop: 24, opacity: 0.6 }}>No diagrams yet. Create your first one above.</p>
      ) : (
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {diagrams.map((d) => (
            <div key={d.id} style={{ border: "1px solid #e8e8e8", borderRadius: 12, padding: 16, background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
              <div style={{ fontSize: 11, opacity: 0.5, fontFamily: "monospace" }}>{d.id.slice(0, 12)} • {d.updatedAt ? new Date((d.updatedAt as any).seconds * 1000).toLocaleString() : ""}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <button onClick={() => onOpen(d.id)} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", background: "#111", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Open</button>
                <button
                  onClick={async () => {
                    const name = prompt("Rename diagram:", d.name);
                    if (name && name.trim() && name !== d.name) {
                      await renameDiagram(d.id, name.trim());
                      load();
                    }
                  }}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
                >
                  Rename
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${d.name}"?`)) return;
                    await deleteDiagram(d.id);
                    load();
                  }}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #fcc", background: "#fff", color: "#c00", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32, padding: 16, background: "#f6f6ff", borderRadius: 10, fontSize: 13, lineHeight: 1.6 }}>
        <strong>How it works:</strong> Each diagram is a doc in <code>diagrams/{`{id}`}</code> with <code>ownerId</code>, <code>name</code>, <code>elements</code> (JSON), <code>appState</code> (JSON). Files go to <code>/files/diagrams/{`{id}`}</code> in Storage. URL is <code>?diagram=ID</code> — bookmark it, share it, it loads from Firestore. Auto-saves every ~1.5s after you draw.
      </div>
    </div>
  );
};
