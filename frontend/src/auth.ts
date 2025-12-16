const TOKEN_KEY = 'ayni_token';
const ROLE_KEY = 'ayni_role';
const FAMILIA_KEY = 'ayni_familia_id';

export type Session = {
  token: string;
  role?: string | null;
  familiaId?: number | null;
};

export function saveSession(session: Session) {
  localStorage.setItem(TOKEN_KEY, session.token);
  if (session.role) localStorage.setItem(ROLE_KEY, session.role);
  if (session.familiaId !== undefined && session.familiaId !== null) {
    localStorage.setItem(FAMILIA_KEY, String(session.familiaId));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(FAMILIA_KEY);
}

export function getSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const role = localStorage.getItem(ROLE_KEY);
  const famRaw = localStorage.getItem(FAMILIA_KEY);
  const familiaId = famRaw ? Number(famRaw) : undefined;
  return { token, role, familiaId };
}
