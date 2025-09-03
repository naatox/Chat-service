export type SerializableMessage = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string; // ISO string
  files?: unknown;
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
  } catch {
    console.warn('No se pudo guardar la sesión en localStorage');
  }
}

export function loadSessionId(scope: string): string | null {
  try {
    return localStorage.getItem(storageKeys.session(scope));
  } catch {
    return null;
  }
}

export function clearSession(scope: string) {
  try {
    localStorage.removeItem(storageKeys.session(scope));
  } catch {
    console.warn('No se pudo eliminar la sesión de localStorage');
  }
}

export function clearChat(sessionId: string) {
  try {
    const welcomeMsg: SerializableMessage = {
            id: crypto.randomUUID(),
            text: "¡Hola! Soy Capin, tu asistente virtual. ¿En qué puedo ayudarte hoy?",
            sender: "assistant",
            timestamp: new Date().toISOString(),
          };
    saveMessages(sessionId, [welcomeMsg]);
  } catch (err) {
    console.warn("No se pudo limpiar el chat:", err);
  }
}