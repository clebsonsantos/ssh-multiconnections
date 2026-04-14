"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "@/store";
import type { Connection, AuthType } from "@/lib/types";

interface ConnectionFormProps {
  connection?: Connection;
  onClose: () => void;
}

const emptyConn = (): Connection => ({
  id: uuidv4(),
  name: "",
  host: "",
  port: 22,
  username: "",
  authType: "password",
  password: "",
  privateKey: "",
  passphrase: "",
  jumpHost: null,
  proxy: null,
  autoReconnect: false,
  favourite: false,
  description: "",
  tags: [],
  groupId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function ConnectionForm({ connection, onClose }: ConnectionFormProps) {
  const saveConnection = useAppStore((s) => s.saveConnection);
  const [form, setForm] = useState<Connection>(
    connection ? { ...connection } : emptyConn()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"basic" | "auth" | "advanced">("basic");

  const set = <K extends keyof Connection>(k: K, v: Connection[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.host.trim() || !form.username.trim()) {
      setError("Name, host and username are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveConnection({ ...form, updatedAt: new Date().toISOString() });
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-default rounded-lg shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <h2 className="text-text-primary font-semibold text-sm">
            {connection ? "Edit Connection" : "New Connection"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border-muted px-4">
          {(["basic", "auth", "advanced"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs capitalize border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-accent-blue text-accent-blue"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === "basic" && (
            <>
              <Field label="Name *">
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="My Server"
                  className={inputCls}
                />
              </Field>
              <Field label="Host *">
                <input
                  value={form.host}
                  onChange={(e) => set("host", e.target.value)}
                  placeholder="192.168.1.1"
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Port">
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) => set("port", Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Username *">
                  <input
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                    placeholder="root"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Optional notes..."
                  rows={2}
                  className={inputCls + " resize-none"}
                />
              </Field>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.favourite}
                    onChange={(e) => set("favourite", e.target.checked)}
                    className="accent-accent-blue"
                  />
                  Favourite
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoReconnect}
                    onChange={(e) => set("autoReconnect", e.target.checked)}
                    className="accent-accent-blue"
                  />
                  Auto-reconnect
                </label>
              </div>
            </>
          )}

          {tab === "auth" && (
            <>
              <Field label="Auth type">
                <select
                  value={form.authType}
                  onChange={(e) => set("authType", e.target.value as AuthType)}
                  className={inputCls}
                >
                  <option value="password">Password</option>
                  <option value="key">Private Key</option>
                  <option value="agent">SSH Agent</option>
                </select>
              </Field>

              {form.authType === "password" && (
                <Field label="Password">
                  <PasswordField
                    value={form.password}
                    onChange={(v) => set("password", v)}
                  />
                </Field>
              )}

              {form.authType === "key" && (
                <>
                  <Field label="Private key (PEM content)">
                    <textarea
                      value={form.privateKey}
                      onChange={(e) => set("privateKey", e.target.value)}
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                      rows={5}
                      className={inputCls + " resize-none font-mono text-xs"}
                    />
                  </Field>
                  <Field label="Passphrase">
                    <PasswordField
                      value={form.passphrase}
                      onChange={(v) => set("passphrase", v)}
                    />
                  </Field>
                </>
              )}
            </>
          )}

          {tab === "advanced" && (
            <>
              <p className="text-text-muted text-xs mb-2">Jump Host (Bastion)</p>
              <Field label="Jump host">
                <input
                  value={form.jumpHost?.host ?? ""}
                  onChange={(e) =>
                    set("jumpHost", e.target.value
                      ? { host: e.target.value, port: form.jumpHost?.port ?? 22, username: form.jumpHost?.username ?? "", password: form.jumpHost?.password ?? "", privateKey: form.jumpHost?.privateKey ?? "" }
                      : null)
                  }
                  placeholder="bastion.example.com"
                  className={inputCls}
                />
              </Field>
              {form.jumpHost && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Jump port">
                      <input
                        type="number"
                        value={form.jumpHost.port}
                        onChange={(e) => set("jumpHost", { ...form.jumpHost!, port: Number(e.target.value) })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Jump user">
                      <input
                        value={form.jumpHost.username}
                        onChange={(e) => set("jumpHost", { ...form.jumpHost!, username: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <Field label="Jump password">
                    <PasswordField
                      value={form.jumpHost.password}
                      onChange={(v) => set("jumpHost", { ...form.jumpHost!, password: v })}
                    />
                  </Field>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {error && (
          <div className="px-4 py-2 text-xs text-accent-red border-t border-border-muted">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border-default">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:text-text-primary hover:border-border-default transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs rounded bg-accent-blue text-white hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-bg-tertiary text-text-primary text-xs px-2.5 py-1.5 rounded border border-border-default placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative flex items-center">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full bg-bg-tertiary text-text-primary text-xs px-2.5 py-1.5 pr-16 rounded border border-border-default placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors"
      />

      {/* Eye toggle */}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-8 text-text-muted hover:text-text-primary transition-colors p-1"
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>

      {/* Copy — only when visible */}
      {visible && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-1 text-text-muted hover:text-accent-blue transition-colors p-1"
          tabIndex={-1}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

