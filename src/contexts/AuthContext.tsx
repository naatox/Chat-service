// =============================================
// src/contexts/AuthContext.tsx
// =============================================
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Definición mínima de identidad que el chat necesita.
 * NO incluir PII sensible. Solo IDs/roles necesarios para autorización.
 */
export type SafeUser = {
  /** ID interno del TMS (no correo, no rut) */
  sub: string;
  /** Nombre para hablar en primera persona (opcional y local) */
  displayName?: string;
  /** Rol/permiso dentro del TMS */
  role: string;
  /** ID del tenant/cliente/empresa (si corresponde) */
  tenantId?: string;
  /** Token de sesión del TMS para llamadas internas del frontend al backend del chat (opcional) */
  sessionToken?: string;
  /** Otros claims no sensibles permitidos por seguridad */
  claims?: Record<string, string | number | boolean>;
};

export type AuthState = {
  user: SafeUser | null;
  loading: boolean;
};

export type AuthContextValue = AuthState & {
  /** Set directo (usado por el bridge con TMS o pruebas locales) */
  setUser: (u: SafeUser | null) => void;
  /** Limpia sesión local del chat sin afectar TMS */
  signOutLocal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ALLOWED_ORIGINS: string[] = [
  "https://tms.insecap.cl",
  "https://stg.tms.insecap.cl",
  "http://localhost:5173",
];

export const AuthProvider: React.FC<React.PropsWithChildren<{ initialUser?: SafeUser | null }>> = ({ children, initialUser = null }) => {
  const [user, setUser] = useState<SafeUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar desde storage (solo para persistencia local del chat)
  useEffect(() => {
    const raw = sessionStorage.getItem("capin.auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SafeUser;
        setUser(parsed);
      } catch {/* ignore */}
    }
    setLoading(false);
  }, []);

  // Persistir mínimamente (no PII)
  useEffect(() => {
    if (user) sessionStorage.setItem("capin.auth", JSON.stringify(user));
    else sessionStorage.removeItem("capin.auth");
  }, [user]);

  // Bridge: recibir identidad desde TMS vía postMessage
  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (!ALLOWED_ORIGINS.includes(ev.origin)) return; // hardening
      const data = ev.data as { type?: string; payload?: unknown };
      if (data?.type !== "TMS_USER") return;

      const p = data.payload as Partial<SafeUser> | undefined;
      if (!p || typeof p !== "object" || !p.sub || !p.role) return;

      const safe: SafeUser = {
        sub: String(p.sub),
        role: String(p.role),
        tenantId: p.tenantId ? String(p.tenantId) : undefined,
        displayName: p.displayName ? String(p.displayName) : undefined,
        sessionToken: p.sessionToken ? String(p.sessionToken) : undefined,
        claims: p.claims ?? {
          
        },
      };
      setUser(safe);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const signOutLocal = () => setUser(null);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, setUser, signOutLocal }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
