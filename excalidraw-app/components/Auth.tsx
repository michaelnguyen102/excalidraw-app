import { useEffect, useState } from "react";
import { subscribeAuth, signInWithGoogle, signOut, type User } from "../auth/firebaseAuth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return { user, loading };
};

export const AuthButton = () => {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  if (loading) return <span style={{ fontSize: 12, opacity: 0.6 }}>Loading…</span>;

  if (!user) {
    return (
      <button
        onClick={async () => {
          setBusy(true);
          try {
            await signInWithGoogle();
          } catch (e: any) {
            alert(e?.message || "Sign in failed");
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #ddd",
          background: "#fff",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {busy ? "Signing in…" : "Sign in with Google"}
      </button>
    );
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      {user.photoURL && (
        <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
      )}
      <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {user.displayName || user.email}
      </span>
      <button
        onClick={() => signOut()}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid #ddd",
          background: "#fff",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Sign out
      </button>
    </span>
  );
};
