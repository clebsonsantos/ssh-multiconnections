"use client";

import { useState } from "react";
import { useAppStore } from "@/store";
import ConnectionItem from "./ConnectionItem";
import type { Connection } from "@/lib/types";

interface SidebarProps {
  onNewConnection: () => void;
  onEditConnection: (conn: Connection) => void;
  onImportExport: () => void;
}

export default function Sidebar({
  onNewConnection,
  onEditConnection,
  onImportExport,
}: SidebarProps) {
  const connections = useAppStore((s) => s.connections);
  const openSession = useAppStore((s) => s.openSession);
  const [search, setSearch] = useState("");

  const filtered = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.host.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-64 flex flex-col border-r border-border-default bg-bg-secondary shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border-muted">
        <span className="text-text-primary font-semibold text-sm">
          SSH Multiconnect
        </span>
        <div className="flex gap-1">
          <button
            onClick={onImportExport}
            title="Import / Export"
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button
            onClick={onNewConnection}
            title="New connection"
            className="p-1 rounded text-text-secondary hover:text-accent-blue hover:bg-bg-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <input
          type="text"
          placeholder="Search connections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-tertiary text-text-primary text-xs px-2 py-1.5 rounded border border-border-default placeholder-text-muted focus:outline-none focus:border-accent-blue"
        />
      </div>

      {/* Connection list */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="text-text-muted text-xs text-center py-8 px-3">
            {connections.length === 0
              ? "No connections yet.\nClick + to add one."
              : "No matches found."}
          </div>
        ) : (
          filtered.map((conn) => (
            <ConnectionItem
              key={conn.id}
              connection={conn}
              onConnect={() => openSession(conn)}
              onEdit={() => onEditConnection(conn)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border-muted">
        <span className="text-text-muted text-xs">
          {connections.length} connection{connections.length !== 1 ? "s" : ""}
        </span>
      </div>
    </aside>
  );
}
