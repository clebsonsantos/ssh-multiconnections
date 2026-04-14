import yaml from "js-yaml";
import { v4 as uuidv4 } from "uuid";
import type { Connection, Group, JumpHost } from "./types";

interface AsBruEntry {
  name?: string;
  ip?: string;
  port?: number;
  user?: string;
  pass?: string | number;
  "auth type"?: string;
  "public key"?: string;
  passphrase?: string;
  description?: string;
  title?: string;
  favourite?: number;
  autoreconnect?: string | number;
  _is_group?: number;
  children?: Record<string, number>;
  parent?: string;
  "jump ip"?: string;
  "jump port"?: number;
  "jump user"?: string;
  "jump pass"?: string;
  "jump key"?: string;
  "proxy ip"?: string;
  "proxy port"?: number;
  "proxy user"?: string;
  "proxy pass"?: string;
  method?: string;
}

type AsBruDoc = Record<string, AsBruEntry>;

export function parseAsbruYaml(content: string): {
  connections: Connection[];
  groups: Group[];
} {
  const doc = yaml.load(content) as AsBruDoc;
  const connections: Connection[] = [];
  const groups: Group[] = [];
  const idMap: Record<string, string> = {};

  // First pass: map old UUIDs to new UUIDs and collect groups
  for (const [oldId, entry] of Object.entries(doc)) {
    if (oldId === "__PAC__EXPORTED__") continue;
    idMap[oldId] = uuidv4();
    if (entry._is_group === 1) {
      groups.push({
        id: idMap[oldId],
        name: entry.name ?? "Unnamed Group",
        parentId: null,
        expanded: true,
      });
    }
  }

  // Second pass: build connections
  for (const [oldId, entry] of Object.entries(doc)) {
    if (oldId === "__PAC__EXPORTED__") continue;
    if (entry._is_group === 1) continue;
    if (entry.method && entry.method !== "SSH") continue;

    const newId = idMap[oldId];
    const parentId =
      entry.parent && entry.parent !== "__PAC__EXPORTED__"
        ? (idMap[entry.parent] ?? null)
        : null;

    let jumpHost: JumpHost | null = null;
    if (entry["jump ip"]) {
      jumpHost = {
        host: entry["jump ip"],
        port: entry["jump port"] ?? 22,
        username: entry["jump user"] ?? "",
        password: entry["jump pass"] ?? "",
        privateKey: entry["jump key"] ?? "",
      };
    }

    const authType =
      entry["auth type"] === "publickey" || entry["public key"]
        ? "key"
        : "password";

    const now = new Date().toISOString();
    connections.push({
      id: newId,
      name: entry.name ?? entry.title ?? "Unnamed",
      host: entry.ip ?? "",
      port: entry.port ?? 22,
      username: entry.user ?? "",
      authType,
      password: String(entry.pass ?? ""),
      privateKey: entry["public key"] ?? "",
      passphrase: entry.passphrase ?? "",
      jumpHost,
      proxy:
        entry["proxy ip"]
          ? {
              host: entry["proxy ip"],
              port: entry["proxy port"] ?? 8080,
              username: entry["proxy user"] ?? "",
              password: entry["proxy pass"] ?? "",
            }
          : null,
      autoReconnect: !!entry.autoreconnect,
      favourite: entry.favourite === 1,
      description: entry.description ?? "",
      tags: [],
      groupId: parentId,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { connections, groups };
}
