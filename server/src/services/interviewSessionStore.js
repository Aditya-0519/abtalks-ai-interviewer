const sessions = new Map();

export const createSession = (session) => {
  sessions.set(session.id, session);

  return session;
};

export const getSession = (sessionId) => {
  return sessions.get(sessionId) || null;
};

export const updateSession = (sessionId, updates) => {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const updatedSession = {
    ...session,
    ...updates,
  };

  sessions.set(sessionId, updatedSession);

  return updatedSession;
};

export const deleteSession = (sessionId) => {
  return sessions.delete(sessionId);
};