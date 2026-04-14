"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Session } from "@/lib/types";
import { useAppStore } from "@/store";
import * as cmds from "@/lib/tauri-commands";

interface TerminalPaneProps {
  session: Session;
}

export default function TerminalPane({ session }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitAddonRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const unlistenDataRef = useRef<(() => void) | null>(null);
  const unlistenStatusRef = useRef<(() => void) | null>(null);
  const updateStatus = useAppStore((s) => s.updateSessionStatus);

  const initTerminal = useCallback(async () => {
    if (!containerRef.current || termRef.current) return;

    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");
    const { WebLinksAddon } = await import("@xterm/addon-web-links");

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.2,
      theme: {
        background: "#0d1117",
        foreground: "#e6edf3",
        cursor: "#58a6ff",
        selectionBackground: "#264f78",
        black: "#0d1117",
        red: "#f85149",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#b1bac4",
        brightBlack: "#6e7681",
        brightRed: "#ff7b72",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Send user input to Rust SSH session
    term.onData((data) => {
      cmds.sendSshInput(session.id, data).catch(() => {});
    });

    // Listen for resize
    term.onResize(({ cols, rows }) => {
      cmds.resizeTerminal(session.id, cols, rows).catch(() => {});
    });

    // Subscribe to SSH data events
    const unlistenData = await cmds.onSshData(session.id, (data) => {
      term.write(data);
    });
    unlistenDataRef.current = unlistenData;

    // Subscribe to SSH status events
    const unlistenStatus = await cmds.onSshStatus(
      session.id,
      (status, error) => {
        updateStatus(
          session.id,
          status as Session["status"],
          error
        );
        if (status === "disconnected" || status === "error") {
          term.write(
            `\r\n\x1b[33m[${status === "error" ? "Error: " + error : "Disconnected"}]\x1b[0m\r\n`
          );
        }
      }
    );
    unlistenStatusRef.current = unlistenStatus;
  }, [session.id, updateStatus]);

  // Fit on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Init terminal once
  useEffect(() => {
    initTerminal();
    return () => {
      unlistenDataRef.current?.();
      unlistenStatusRef.current?.();
      termRef.current?.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [initTerminal]);

  const statusColor = {
    connecting: "text-accent-yellow",
    connected: "text-accent-green",
    disconnected: "text-text-muted",
    error: "text-accent-red",
  }[session.status];

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-3 py-0.5 bg-bg-secondary border-b border-border-muted text-xs shrink-0">
        <span className={statusColor}>{session.status}</span>
        <span className="text-text-muted">•</span>
        <span className="text-text-secondary">{session.connectionName}</span>
        {session.error && (
          <>
            <span className="text-text-muted">•</span>
            <span className="text-accent-red truncate">{session.error}</span>
          </>
        )}
      </div>

      {/* xterm container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden p-1"
        style={{ minHeight: 0 }}
      />
    </div>
  );
}
