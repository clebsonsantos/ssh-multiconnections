"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import Sidebar from "@/components/Sidebar/Sidebar";
import TerminalTabs from "@/components/Terminal/TerminalTabs";
import ConnectionForm from "@/components/Dialogs/ConnectionForm";
import ImportExportDialog from "@/components/Dialogs/ImportExportDialog";
import type { Connection } from "@/lib/types";

export default function AppLayout() {
  const loadConnections = useAppStore((s) => s.loadConnections);
  const [editingConn, setEditingConn] = useState<Connection | null | "new">(
    null
  );
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      {/* Left Sidebar */}
      <Sidebar
        onNewConnection={() => setEditingConn("new")}
        onEditConnection={(conn) => setEditingConn(conn)}
        onImportExport={() => setShowImportExport(true)}
      />

      {/* Main terminal area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TerminalTabs />
      </main>

      {/* Dialogs */}
      {editingConn !== null && (
        <ConnectionForm
          connection={editingConn === "new" ? undefined : editingConn}
          onClose={() => setEditingConn(null)}
        />
      )}

      {showImportExport && (
        <ImportExportDialog onClose={() => setShowImportExport(false)} />
      )}
    </div>
  );
}
