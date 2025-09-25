import { useState, useEffect, useCallback } from 'react';

export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('');

  // Generar un nuevo session_id usando crypto.randomUUID
  const generateSessionId = useCallback((): string => {
    const newId = crypto.randomUUID();
    return newId;
  }, []);

  // Cargar session_id desde localStorage al montar el hook
  useEffect(() => {
    const storedSessionId = localStorage.getItem('rag_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      // Si no hay session_id, generar uno nuevo
      const newId = generateSessionId();
      localStorage.setItem('rag_session_id', newId);
      setSessionId(newId);
    }
  }, [generateSessionId]);

  // Función para resetear la sesión
  const resetSession = useCallback((): string => {
    const newId = generateSessionId();
    localStorage.setItem('rag_session_id', newId);
    setSessionId(newId);
    return newId;
  }, [generateSessionId]);

  // Función para obtener el session_id actual
  const getCurrentSessionId = useCallback((): string => {
    return sessionId || localStorage.getItem('rag_session_id') || generateSessionId();
  }, [sessionId, generateSessionId]);

  return {
    sessionId,
    resetSession,
    getCurrentSessionId
  };
};