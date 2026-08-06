import { createContext, useContext, useEffect, useState } from "react";
import { subscribeAuth, signInWithGoogle, signOut, handleRedirectResult, type User } from "../auth/firebaseAuth";

type AuthState = { user: User | null; loading: boolean };
const AuthCtx = createContext<AuthState>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  useEffect(() => {
    handleRedirectResult().catch(() => {});
    const unsub = subscribeAuth((u) => {
      setState({ user: u, loading: false });
    });
    return () => unsub();
  }, []);
  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);

export const AuthButton = () => {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <span style={{ fontSize: 12, opacity: 0.6 }}>Loading…</span>;

  if (!user) {
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
        <button
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await signInWithGoogle();
            } catch (e: any) {
              const code = e?.code || "";
              const msg = e?.message || "Sign in failed";
              if (code === "auth/popup-blocked") {
                setError("Popup blocked — allowing redirect… If nothing happens, please allow popups for this site and try again.");
              } else if (code === "auth/unauthorized-domain") {
                setError("Domain not authorized — add excalidraw-one-swart.vercel.app in Firebase Console → Authentication → Settings → Authorized domains");
              } else {
                setError(msg);
              }
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
        {error && <span style={{ fontSize: 11, color: "#c00", maxWidth: 260, textAlign: "right" }}>{error}</span>}
      </span>
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
