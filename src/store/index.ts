import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Connection, Group, Session, SessionStatus } from "@/lib/types";
import * as cmds from "@/lib/tauri-commands";

interface AppState {
  // Connections
  connections: Connection[];
  groups: Group[];
  loadConnections: () => Promise<void>;
  saveConnection: (conn: Connection) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  upsertConnectionLocal: (conn: Connection) => void;

  // Sessions (open terminals)
  sessions: Session[];
  activeSessionId: string | null;
  openSession: (connection: Connection) => Promise<string>;
  closeSession: (sessionId: string) => void;
  updateSessionStatus: (id: string, status: SessionStatus, error?: string) => void;
  setActiveSession: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Connections ─────────────────────────────────────────────────────────
  connections: [],
  groups: [],

  loadConnections: async () => {
    try {
      const connections = await cmds.getConnections();
      set({ connections });
    } catch {
      // First run — no file yet
      set({ connections: [] });
    }
  },

  saveConnection: async (conn) => {
    await cmds.saveConnection(conn);
    set((s) => {
      const idx = s.connections.findIndex((c) => c.id === conn.id);
      if (idx === -1) return { connections: [...s.connections, conn] };
      const updated = [...s.connections];
      updated[idx] = conn;
      return { connections: updated };
    });
  },

  deleteConnection: async (id) => {
    await cmds.deleteConnection(id);
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
  },

  upsertConnectionLocal: (conn) =>
    set((s) => {
      const idx = s.connections.findIndex((c) => c.id === conn.id);
      if (idx === -1) return { connections: [...s.connections, conn] };
      const updated = [...s.connections];
      updated[idx] = conn;
      return { connections: updated };
    }),

  // ─── Sessions ─────────────────────────────────────────────────────────────
  sessions: [],
  activeSessionId: null,

  openSession: async (connection) => {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      connectionId: connection.id,
      connectionName: connection.name,
      status: "connecting",
    };

    set((s) => ({
      sessions: [...s.sessions, session],
      activeSessionId: sessionId,
    }));

    try {
      await cmds.connectSsh({
        sessionId,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        authType: connection.authType,
        password: connection.password,
        privateKey: connection.privateKey,
        passphrase: connection.passphrase,
      });
    } catch (err) {
      get().updateSessionStatus(sessionId, "error", String(err));
    }

    return sessionId;
  },

  closeSession: (sessionId) => {
    cmds.disconnectSsh(sessionId).catch(() => {});
    set((s) => {
      const sessions = s.sessions.filter((s) => s.id !== sessionId);
      const activeSessionId =
        s.activeSessionId === sessionId
          ? (sessions[sessions.length - 1]?.id ?? null)
          : s.activeSessionId;
      return { sessions, activeSessionId };
    });
  },

  updateSessionStatus: (id, status, error) =>
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === id ? { ...sess, status, error } : sess
      ),
    })),

  setActiveSession: (id) => set({ activeSessionId: id }),
}));
