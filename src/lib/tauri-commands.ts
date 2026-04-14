import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Connection, AppExport } from "./types";

// ─── Connection Storage ────────────────────────────────────────────────────

export const getConnections = () =>
  invoke<Connection[]>("get_connections");

export const saveConnection = (connection: Connection) =>
  invoke<void>("save_connection", { connection });

export const deleteConnection = (id: string) =>
  invoke<void>("delete_connection", { id });

// ─── Import / Export ───────────────────────────────────────────────────────

export const importAppFormat = (content: string) =>
  invoke<AppExport>("import_connections", { content });

export const exportAppFormat = () =>
  invoke<string>("export_connections");

// ─── SSH Sessions ──────────────────────────────────────────────────────────

export interface ConnectSshArgs {
  sessionId: string;
  host: string;
  port: number;
  username: string;
  authType: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export const connectSsh = (args: ConnectSshArgs) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke<void>("connect_ssh", args as any);

export const disconnectSsh = (sessionId: string) =>
  invoke<void>("disconnect_ssh", { sessionId });

export const sendSshInput = (sessionId: string, data: string) =>
  invoke<void>("send_ssh_input", { sessionId, data });

export const resizeTerminal = (
  sessionId: string,
  cols: number,
  rows: number
) => invoke<void>("resize_terminal", { sessionId, cols, rows });

// ─── Event listeners ───────────────────────────────────────────────────────

export const onSshData = (
  sessionId: string,
  callback: (data: string) => void
) =>
  listen<string>(`ssh://data/${sessionId}`, (event) =>
    callback(event.payload)
  );

export const onSshStatus = (
  sessionId: string,
  callback: (status: string, error?: string) => void
) =>
  listen<{ status: string; error?: string }>(
    `ssh://status/${sessionId}`,
    (event) => callback(event.payload.status, event.payload.error)
  );
