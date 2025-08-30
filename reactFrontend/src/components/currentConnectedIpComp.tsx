// src/screens/currentConnectIP.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type CurrentIP = {
  id: number;
  ip_address: string;
  user_ids: number[];
  is_suspicious: boolean;
};

const DEFAULT_BASE = "http://localhost:8080";
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || DEFAULT_BASE;

export default function CurrentConnectIP() {
  const [rows, setRows] = useState<CurrentIP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI controls
  const [search, setSearch] = useState("");
  const [onlySuspicious, setOnlySuspicious] = useState(false);

  async function fetchRows() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<CurrentIP[]>(
        `${API_BASE}/ip/current_connected_ips`,
        { headers: { Accept: "application/json" } }
      );
      setRows(res.data ?? []);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to fetch IP records";
      setError(`Request failed${status ? ` (${status})` : ""}: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyIP(ip: string) {
    try {
      await navigator.clipboard.writeText(ip);
      setSuccess(`Copied ${ip}`);
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      setError("Could not copy IP to clipboard");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlySuspicious && !r.is_suspicious) return false;
      if (!q) return true;
      const hay = [
        String(r.id),
        r.ip_address,
        r.user_ids.join(","),
        r.is_suspicious ? "suspicious" : "normal",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, onlySuspicious]);

  const normalCount = useMemo(
    () => rows.filter((r) => !r.is_suspicious).length,
    [rows]
  );

  return (
    <>
      {/* Component-scoped CSS */}
      <style>{`
:root {
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;
  --shadow: 0 1px 2px rgba(0,0,0,0.05);
  --emerald-bg: #ecfdf5;
  --emerald: #047857;
  --emerald-ring: #a7f3d0;
  --amber-bg: #fffbeb;
  --amber: #b45309;
  --red-bg: #fef2f2;
  --red: #b91c1c;
  --green-bg: #ecfdf5;
  --green: #065f46;
}
* { box-sizing: border-box; }

.ccip-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 24px;
  display: flex;
  justify-content: center;
  color: var(--text);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
}
.ccip-main { width: 100%; max-width: 1000px; }

.ccip-header {
  display: grid; gap: 12px; grid-template-columns: 1fr; margin-bottom: 16px;
}
@media (min-width: 640px) {
  .ccip-header { grid-template-columns: 1fr auto; align-items: center; }
}
.ccip-title { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; }
.ccip-subtitle { margin: 0; font-size: 14px; color: var(--muted); }

.ccip-controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.ccip-checklabel { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; }
.ccip-checkbox { width: 16px; height: 16px; }

.ccip-search {
  width: 260px; max-width: 60vw; padding: 8px 10px; border: 1px solid var(--border);
  border-radius: 8px; font-size: 14px; outline: none;
}
.ccip-search:focus { border-color: var(--emerald-ring); box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px; font-size: 14px; line-height: 1;
  cursor: pointer; border: 1px solid var(--border); background: #fff;
  transition: background 120ms ease, opacity 120ms ease;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: #059669; color: #fff; border-color: transparent; }
.btn-primary:hover { background: #047857; }
.btn-ghost:hover { background: #f3f4f6; }

.banner { border-radius: 8px; padding: 10px 12px; font-size: 14px; margin-bottom: 12px; }
.banner-error { background: var(--red-bg); color: var(--red); border: 1px solid #fecaca; }
.banner-success { background: var(--green-bg); color: var(--green); border: 1px solid #a7f3d0; }

.tablebox {
  overflow-x: auto; border: 1px solid var(--border); border-radius: 12px;
  background: var(--card); box-shadow: var(--shadow);
}
.table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 14px; }
.table thead { background: #f3f4f6; color: #374151; text-transform: uppercase; font-size: 12px; }
.table th, .table td { padding: 10px 12px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
.table tbody tr:nth-child(even) { background: #fafafa; }
.table-empty { text-align: center; color: var(--muted); padding: 18px 12px; }

.muted { color: #9ca3af; }
.mono { font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace; }

.chipset { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 999px;
  background: #f3f4f6; color: #374151; font-size: 12px; border: 1px solid var(--border);
}

.badge { display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 999px; font-size: 12px; border: 1px solid transparent; }
.badge-emerald { background: var(--emerald-bg); color: var(--emerald); border-color: var(--emerald-ring); }
.badge-amber { background: var(--amber-bg); color: var(--amber); border-color: #fde68a; }

.ccip-hints { margin-top: 10px; font-size: 11px; color: var(--muted); }
      `}</style>

      <div className="ccip-page">
        <main className="ccip-main" role="main">
          {/* Header */}
          <div className="ccip-header">
            <div>
              <h1 className="ccip-title">Current Connected IPs</h1>
              <p className="ccip-subtitle">
                {rows.length} records • {normalCount} normal
              </p>
            </div>

            <div className="ccip-controls">
              <label className="ccip-checklabel">
                <input
                  type="checkbox"
                  className="ccip-checkbox"
                  checked={onlySuspicious}
                  onChange={(e) => setOnlySuspicious(e.target.checked)}
                />
                <span>Show suspicious only</span>
              </label>

              <input
                type="text"
                placeholder="Search IP / user id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ccip-search"
              />

              <button
                onClick={fetchRows}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Banners */}
          {error && <div className="banner banner-error">{error}</div>}
          {success && <div className="banner banner-success">{success}</div>}

          {/* Table */}
          <div className="tablebox">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>IP Address</th>
                  <th>User IDs</th>
                  <th># Users</th>
                  <th>Status</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      {loading ? "Loading…" : "No records found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="mono">{r.id}</td>
                      <td>{r.ip_address}</td>
                      <td>
                        {r.user_ids?.length ? (
                          <div className="chipset">
                            {r.user_ids.map((uid) => (
                              <span key={uid} className="chip">
                                {uid}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>{r.user_ids?.length ?? 0}</td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (r.is_suspicious ? "badge-amber" : "badge-emerald")
                          }
                        >
                          {r.is_suspicious ? "Suspicious" : "Normal"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => copyIP(r.ip_address)}
                          className="btn btn-ghost"
                          title="Copy IP"
                        >
                          Copy IP
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Endpoint hint (optional) */}
          <div className="ccip-hints">
            List: <code>{API_BASE}/ip/current_connected_ips</code>
          </div>
        </main>
      </div>
    </>
  );
}
