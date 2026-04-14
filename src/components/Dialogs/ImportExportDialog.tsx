"use client";

import { useRef, useState } from "react";
import { useAppStore } from "@/store";
import { parseAsbruYaml } from "@/lib/asbru";
import * as cmds from "@/lib/tauri-commands";

interface ImportExportDialogProps {
  onClose: () => void;
}

export default function ImportExportDialog({ onClose }: ImportExportDialogProps) {
  const connections = useAppStore((s) => s.connections);
  const saveConnection = useAppStore((s) => s.saveConnection);
  const upsertLocal = useAppStore((s) => s.upsertConnectionLocal);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const asbruInputRef = useRef<HTMLInputElement>(null);
  const ownInputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsText(file);
    });

  const handleImportAsbru = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const content = await readFile(file);
      const { connections: imported } = parseAsbruYaml(content);
      for (const conn of imported) {
        await saveConnection(conn);
      }
      setStatus({ type: "success", msg: `Imported ${imported.length} connection(s) from Asbru.` });
    } catch (err) {
      setStatus({ type: "error", msg: String(err) });
    } finally {
      setLoading(false);
      if (asbruInputRef.current) asbruInputRef.current.value = "";
    }
  };

  const handleImportOwn = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const content = await readFile(file);
      const data = await cmds.importAppFormat(content);
      for (const conn of data.connections) {
        upsertLocal(conn);
      }
      setStatus({ type: "success", msg: `Imported ${data.connections.length} connection(s).` });
    } catch (err) {
      setStatus({ type: "error", msg: String(err) });
    } finally {
      setLoading(false);
      if (ownInputRef.current) ownInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const json = await cmds.exportAppFormat();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sshmc-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", msg: `Exported ${connections.length} connection(s).` });
    } catch (err) {
      setStatus({ type: "error", msg: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-default rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <h2 className="text-text-primary font-semibold text-sm">Import / Export</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Import Asbru */}
          <Section
            title="Import from Asbru"
            description="Select an Asbru .yml export file."
            icon="📥"
          >
            <input
              ref={asbruInputRef}
              type="file"
              accept=".yml,.yaml"
              onChange={handleImportAsbru}
              className="hidden"
              id="asbru-file"
            />
            <label
              htmlFor="asbru-file"
              className={btnSecondary + " cursor-pointer inline-block"}
            >
              Choose Asbru file…
            </label>
          </Section>

          {/* Import own format */}
          <Section
            title="Import (.json)"
            description="Import a previously exported SSH Multiconnect file."
            icon="📂"
          >
            <input
              ref={ownInputRef}
              type="file"
              accept=".json"
              onChange={handleImportOwn}
              className="hidden"
              id="own-file"
            />
            <label
              htmlFor="own-file"
              className={btnSecondary + " cursor-pointer inline-block"}
            >
              Choose .json file…
            </label>
          </Section>

          {/* Export */}
          <Section
            title="Export"
            description={`Export all ${connections.length} connection(s) to a JSON file.`}
            icon="💾"
          >
            <button onClick={handleExport} disabled={loading} className={btnPrimary}>
              {loading ? "Exporting…" : "Export JSON"}
            </button>
          </Section>

          {/* Status */}
          {status && (
            <div
              className={`text-xs px-3 py-2 rounded border ${
                status.type === "success"
                  ? "border-accent-green text-accent-green bg-accent-green/10"
                  : "border-accent-red text-accent-red bg-accent-red/10"
              }`}
            >
              {status.msg}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border-default flex justify-end">
          <button onClick={onClose} className={btnSecondary}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded border border-border-muted bg-bg-tertiary">
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-xs font-medium">{title}</p>
        <p className="text-text-muted text-xs mt-0.5 mb-2">{description}</p>
        {children}
      </div>
    </div>
  );
}

const btnPrimary =
  "px-3 py-1.5 text-xs rounded bg-accent-blue text-white hover:opacity-90 disabled:opacity-50 transition-opacity font-medium";
const btnSecondary =
  "px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors";
