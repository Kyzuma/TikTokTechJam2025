// src/components/trustActivityComp.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type TrustLog = {
  id: number;
  user_id: number;
  added_trust: number;   // e.g. -1, 0, +1, +5
  remarks?: string | null;
  created_at: string;    // ISO
};

// Base URL: defaults to http://localhost:8080 (from your Flask Swagger config).
const DEFAULT_BASE = "http://localhost:8080";
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || DEFAULT_BASE;

export default function TrustActivityComp() {
  const [rows, setRows] = useState<TrustLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const apiUrl = `${API_BASE}/trust_log/trust_logs`;

  const fetchLogs = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<TrustLog[]>(apiUrl, {
        headers: { Accept: "application/json" },
        signal,
      });
      setRows(res.data ?? []);
    } catch (e: any) {
      if (axios.isCancel(e)) return;
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to fetch trust logs";
      setError(`Request failed${status ? ` (${status})` : ""}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchLogs(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let data = rows;
    if (q) {
      data = rows.filter((r) => {
        const hay = `${r.id} ${r.user_id} ${r.added_trust} ${r.remarks ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    data = [...data].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortNewestFirst ? tb - ta : ta - tb;
    });
    return data;
  }, [rows, search, sortNewestFirst]);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search user / remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-72"
          />
          <button
            onClick={() => setSortNewestFirst((v) => !v)}
            className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {sortNewestFirst ? "Newest → Oldest" : "Oldest → Newest"}
          </button>
        </div>

        {/* <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button> */}
      </div>

      {/* Error/Loading */}
      {error && (
        <div className="mb-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
          {error}
        </div>
      )}
      {loading && !rows.length && (
        <div className="mb-3 text-sm text-gray-600">Loading trust activity…</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-3 py-2 border-b">Log ID</th>
              <th className="px-3 py-2 border-b">Created</th>
              <th className="px-3 py-2 border-b">User ID</th>
              <th className="px-3 py-2 border-b">Δ Trust</th>
              <th className="px-3 py-2 border-b">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={5}>
                  {loading ? "Loading…" : "No trust logs found."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="even:bg-gray-50">
                  <td className="px-3 py-2 border-b font-mono">{r.id}</td>
                  <td className="px-3 py-2 border-b">{fmtDate(r.created_at)}</td>
                  <td className="px-3 py-2 border-b">{r.user_id}</td>
                  <td className="px-3 py-2 border-b">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs " +
                        (r.added_trust > 0
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : r.added_trust < 0
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200")
                      }
                    >
                      {r.added_trust > 0 ? `+${r.added_trust}` : r.added_trust}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b">
                    {r.remarks || <span className="text-gray-500">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* API hint */}
      <div className="mt-3 text-[11px] text-gray-500">
        API: <code className="font-mono">{API_BASE}/trust_log/trust_logs</code>
      </div>
    </div>
  );
}

// helpers
function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
