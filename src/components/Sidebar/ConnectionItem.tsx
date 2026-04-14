"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import type { Connection } from "@/lib/types";
import clsx from "clsx";

interface ConnectionItemProps {
  connection: Connection;
  onConnect: () => void;
  onEdit: () => void;
}

export default function ConnectionItem({
  connection,
  onConnect,
  onEdit,
}: ConnectionItemProps) {
  const deleteConnection = useAppStore((s) => s.deleteConnection);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Close context menu on Escape key
  useEffect(() => {
    if (!menuPos) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuPos(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuPos]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      {/* Row — div, not button, to avoid nested-button issues */}
      <div
        className="group relative px-2 py-0.5"
        onContextMenu={handleContextMenu}
      >
        <div
          onDoubleClick={onConnect}
          className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-bg-hover transition-colors select-none"
        >
          {/* Status dot */}
          <span className="shrink-0 w-2 h-2 rounded-full bg-bg-hover border border-border-default" />

          {/* Info */}
          <div className="flex-1 min-w-0 pr-16">
            <div className="text-xs text-text-primary truncate font-medium">
              {connection.name}
            </div>
            <div className="text-xs text-text-muted truncate">
              {connection.username}@{connection.host}:{connection.port}
            </div>
          </div>

          {connection.favourite && (
            <span className="text-accent-yellow text-xs shrink-0">★</span>
          )}
        </div>

        {/* Hover action buttons — absolutely positioned over the row */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <ActionBtn color="text-accent-green" onClick={onConnect}>
            <PlayIcon />
          </ActionBtn>
          <ActionBtn color="text-text-secondary" onClick={onEdit}>
            <EditIcon />
          </ActionBtn>
          <ActionBtn
            color="text-accent-red"
            onClick={() => setShowDeleteDialog(true)}
          >
            <TrashIcon />
          </ActionBtn>
        </div>
      </div>

      {/* Context menu — backdrop closes on outside click, menu items fire onClick normally */}
      {menuPos && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuPos(null)}
            onContextMenu={(e) => { e.preventDefault(); setMenuPos(null); }}
          />
          <ContextMenu
            x={menuPos.x}
            y={menuPos.y}
            onConnect={() => { setMenuPos(null); onConnect(); }}
            onEdit={() => { setMenuPos(null); onEdit(); }}
            onDelete={() => { setMenuPos(null); setShowDeleteDialog(true); }}
          />
        </>
      )}

      {/* Delete dialog with typed confirmation */}
      {showDeleteDialog && (
        <DeleteDialog
          name={connection.name}
          onConfirm={async () => {
            await deleteConnection(connection.id);
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({
  color,
  onClick,
  children,
}: {
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={clsx(
        "p-1 rounded hover:bg-bg-tertiary transition-colors",
        color
      )}
    >
      <span className="block w-3.5 h-3.5">{children}</span>
    </button>
  );
}

// ─── Context menu ─────────────────────────────────────────────────────────────

function ContextMenu({
  x,
  y,
  onConnect,
  onEdit,
  onDelete,
}: {
  x: number;
  y: number;
  onConnect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Adjust if near the edge
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({
      x: x + width > window.innerWidth ? x - width : x,
      y: y + height > window.innerHeight ? y - height : y,
    });
  }, [x, y]);

  return (
    <div
      ref={ref}
      style={{ top: pos.y, left: pos.x }}
      className="fixed z-50 min-w-44 bg-bg-secondary border border-border-default rounded-lg shadow-2xl py-1 text-xs"
    >
      <MenuItem icon={<PlayIcon />} label="Connect" color="text-accent-green" onClick={onConnect} />
      <MenuItem icon={<EditIcon />} label="Edit" color="text-text-primary" onClick={onEdit} />
      <div className="my-1 border-t border-border-muted" />
      <MenuItem icon={<TrashIcon />} label="Delete" color="text-accent-red" onClick={onDelete} />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-2.5 px-3 py-2 hover:bg-bg-hover transition-colors",
        color
      )}
    >
      <span className="w-3.5 h-3.5 shrink-0">{icon}</span>
      {label}
    </button>
  );
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteDialog({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmed = typed === name;

  const handleConfirm = async () => {
    if (!confirmed || loading) return;
    setLoading(true);
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-accent-red/40 rounded-lg shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default">
          <span className="text-accent-red">⚠</span>
          <h2 className="text-sm font-semibold text-text-primary">Delete Connection</h2>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            Essa ação não pode ser desfeita. Digite o nome da conexão para confirmar:
          </p>

          {/* Name to retype */}
          <div className="bg-bg-tertiary border border-border-default rounded px-3 py-1.5 font-mono text-xs text-text-primary select-all">
            {name}
          </div>

          <input
            autoFocus
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            placeholder="Digite o nome acima…"
            className={clsx(
              "w-full bg-bg-tertiary text-text-primary text-xs px-2.5 py-1.5 rounded border placeholder-text-muted focus:outline-none transition-colors",
              typed.length === 0
                ? "border-border-default"
                : confirmed
                ? "border-accent-green"
                : "border-accent-red/60"
            )}
          />
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border-default">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmed || loading}
            className="px-4 py-1.5 text-xs rounded bg-accent-red text-white font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? "Deletando…" : "Deletar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fillOpacity={0.15} />
      <polygon points="10 8 16 12 10 16" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
