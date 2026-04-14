"use client";

import { useAppStore } from "@/store";
import TerminalPane from "./TerminalPane";
import clsx from "clsx";

export default function TerminalTabs() {
  const sessions = useAppStore((s) => s.sessions);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const setActiveSession = useAppStore((s) => s.setActiveSession);
  const closeSession = useAppStore((s) => s.closeSession);

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="text-6xl mb-4">⌨</div>
          <p className="text-text-secondary text-sm">
            Double-click a connection to open a terminal
          </p>
          <p className="text-text-muted text-xs mt-1">
            or click the ▶ icon on hover
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-1 pt-1 bg-bg-secondary border-b border-border-default shrink-0 overflow-x-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-t cursor-pointer text-xs select-none shrink-0 group",
              "border border-b-0 transition-colors",
              session.id === activeSessionId
                ? "bg-bg-primary border-border-default text-text-primary"
                : "bg-bg-tertiary border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            )}
            onClick={() => setActiveSession(session.id)}
          >
            {/* Status indicator */}
            <span
              className={clsx("w-1.5 h-1.5 rounded-full shrink-0", {
                "bg-accent-yellow animate-pulse": session.status === "connecting",
                "bg-accent-green": session.status === "connected",
                "bg-accent-red": session.status === "error",
                "bg-text-muted": session.status === "disconnected",
              })}
            />

            <span className="max-w-32 truncate">{session.connectionName}</span>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-accent-red transition-all"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Terminal panes – all mounted, only active is visible */}
      <div className="flex-1 relative overflow-hidden">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={clsx(
              "absolute inset-0",
              session.id === activeSessionId ? "block" : "hidden"
            )}
          >
            <TerminalPane session={session} />
          </div>
        ))}
      </div>
    </div>
  );
}
