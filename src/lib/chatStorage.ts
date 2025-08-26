export type SerializableMessage = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string; // ISO string
  files?: any;
};

const NAMESPACE = 'capin:chat';

export const storageKeys = {
  session: (scope = 'default') => `${NAMESPACE}:session:${scope}`,
  messages: (sessionId: string) => `${NAMESPACE}:messages:${sessionId}`,
};

export function saveMessages(sessionId: string, messages: SerializableMessage[]) {
  try {
    localStorage.setItem(storageKeys.messages(sessionId), JSON.stringify(messages));
  } catch (e) {
    console.warn('No se pudo guardar mensajes en localStorage', e);
  }
}

export function loadMessages(sessionId: string): SerializableMessage[] | null {
  try {
    const raw = localStorage.getItem(storageKeys.messages(sessionId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSessionId(scope: string, sessionId: string) {
  try {
    localStorage.setItem(storageKeys.session(scope), sessionId);
  } catch {}
}

export function loadSessionId(scope: string): string | null {
  try {
    return localStorage.getItem(storageKeys.session(scope));
  } catch {
    return null;
  }
}
