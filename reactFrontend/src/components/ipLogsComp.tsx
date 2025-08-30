// src/components/ipLogsComp.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type IpLog = {
  id: number;
  user_id: number;
  ip_address: string;
  is_suspicious: boolean;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  checked_at: string; // ISO
  remarks?: string | null;
};

type SuspiciousFilter = "all" | "true" | "false";

const DEFAULT_BASE = "http://localhost:8080";
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || DEFAULT_BASE;

export default function IpLogsComp() {
  const [rows, setRows] = useState<IpLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [suspicious, setSuspicious] = useState<SuspiciousFilter>("all");

  const apiUrl = useMemo(() => {
    const url = new URL("/ip/ip_logs", API_BASE);
    if (suspicious !== "all") url.searchParams.set("suspicious", suspicious);
    return url.toString();
  }, [suspicious]);

  const fetchLogs = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<IpLog[]>(apiUrl, {
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
        "Failed to fetch IP logs";
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
  }, [apiUrl]);

  const markSafe = async (logId: number) => {
    try {
      await axios.put(`${API_BASE}/ip/mark_safe/${logId}`);
      // Refresh logs after marking safe
      fetchLogs();
    } catch (e: any) {
      alert(
        `Failed to mark safe (ID: ${logId}) → ${
          e?.response?.data?.error || e.message
        }`
      );
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay =
        `${r.id} ${r.user_id} ${r.ip_address} ${r.country ?? ""} ${r.region ?? ""} ${r.city ?? ""} ${r.remarks ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="susp" className="text-sm text-gray-600">
            Show:
          </label>
          <select
            id="susp"
            value={suspicious}
            onChange={(e) => setSuspicious(e.target.value as SuspiciousFilter)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="true">Suspicious only</option>
            <option value="false">Non-suspicious</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search IP / user / country / remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-72"
          />
          {/* <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button> */}
        </div>
      </div>

      {/* Error/Loading */}
      {error && (
        <div className="mb-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
          {error}
        </div>
      )}
      {loading && !rows.length && (
        <div className="mb-3 text-sm text-gray-600">Loading IP logs…</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-3 py-2 border-b">ID</th>
              <th className="px-3 py-2 border-b">Checked at</th>
              <th className="px-3 py-2 border-b">User</th>
              <th className="px-3 py-2 border-b">IP</th>
              <th className="px-3 py-2 border-b">Geo</th>
              <th className="px-3 py-2 border-b">Lat/Lng</th>
              <th className="px-3 py-2 border-b">Status</th>
              <th className="px-3 py-2 border-b">Remarks</th>
              <th className="px-3 py-2 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={9}>
                  {loading ? "Loading…" : "No IP logs found."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="even:bg-gray-50">
                  <td className="px-3 py-2 border-b font-mono">{r.id}</td>
                  <td className="px-3 py-2 border-b">{fmtDate(r.checked_at)}</td>
                  <td className="px-3 py-2 border-b">{r.user_id}</td>
                  <td className="px-3 py-2 border-b font-mono">{r.ip_address}</td>
                  <td className="px-3 py-2 border-b">
                    {[r.city, r.region, r.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 border-b">
                    {isNum(r.latitude) && isNum(r.longitude)
                      ? `${r.latitude}, ${r.longitude}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 border-b">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs " +
                        (r.is_suspicious
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-green-100 text-green-700 border border-green-200")
                      }
                    >
                      {r.is_suspicious ? "Suspicious" : "OK"}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b">
                    {r.remarks ? r.remarks : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="px-3 py-2 border-b">
                    {r.is_suspicious ? (
                      <button
                        onClick={() => markSafe(r.id)}
                        className="text-xs px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Mark Safe
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-gray-500">
        API: <code className="font-mono">{API_BASE}/ip/ip_logs</code>
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

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
