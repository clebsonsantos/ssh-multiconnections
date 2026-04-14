export type AuthType = "password" | "key" | "agent";

export interface JumpHost {
  host: string;
  port: number;
  username: string;
  password: string;
  privateKey: string;
}

export interface ProxyConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  password: string;
  privateKey: string;
  passphrase: string;
  jumpHost: JumpHost | null;
  proxy: ProxyConfig | null;
  autoReconnect: boolean;
  favourite: boolean;
  description: string;
  tags: string[];
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  parentId: string | null;
  expanded: boolean;
}

export type SessionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface Session {
  id: string;
  connectionId: string;
  connectionName: string;
  status: SessionStatus;
  error?: string;
}

export interface AppExport {
  version: "1.0";
  exportedAt: string;
  connections: Connection[];
  groups: Group[];
}
