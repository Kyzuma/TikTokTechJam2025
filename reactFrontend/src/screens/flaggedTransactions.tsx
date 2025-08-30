// src/screens/flaggedTransactions.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type FlaggedTx = {
  flagged_transaction_id: number;
  created_at: string;
  transaction_ids: number[];
  is_resolved: boolean;
  reason?: string | null;
};

type ResolvedFilter = "all" | "true" | "false";

const DEFAULT_BASE = "http://localhost:8080";
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || DEFAULT_BASE;

export default function FlaggedTransactions() {
  const navigate = useNavigate();

  const [data, setData] = useState<FlaggedTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>("all");
  const [search, setSearch] = useState("");

  // ":" menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Build URL with optional ?resolved=
  const apiUrl = useMemo(() => {
    const url = new URL("/transaction/flagged_transactions", API_BASE);
    if (resolvedFilter !== "all") url.searchParams.set("resolved", resolvedFilter);
    return url.toString();
  }, [resolvedFilter]);

  const fetchData = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<FlaggedTx[]>(apiUrl, {
        headers: { Accept: "application/json" },
        signal,
      });
      const normalized = (res.data || []).map((r) => ({
        ...r,
        transaction_ids: Array.isArray(r.transaction_ids)
          ? r.transaction_ids.map((n) => Number(n))
          : [],
      }));
      setData(normalized);
    } catch (e: any) {
      if (axios.isCancel(e)) return;
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message || e?.message || "Failed to fetch flagged transactions";
      setError(`Request failed${status ? ` (${status})` : ""}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Batch processing then reload
  const refreshAndCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await axios.get(`${API_BASE}/transaction/check_transactions`, {
        headers: { Accept: "application/json" },
      });
      setSuccess("Batch processing completed – flagged transactions updated.");
      await fetchData();
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Failed to run check_transactions";
      setError(`Refresh failed${status ? ` (${status})` : ""}: ${msg}`);
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  // Close ":" menu on outside click / Esc
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    if (menuOpen) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Client-side search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => {
      const inReason = (row.reason || "").toLowerCase().includes(q);
      const inIds = row.transaction_ids.join(",").includes(q);
      const inId = String(row.flagged_transaction_id).includes(q);
      return inReason || inIds || inId;
    });
  }, [data, search]);

  return (
    <div className="min-h-screen w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Back */}
      <button
        onClick={() => navigate("/adminOverview")}
        className="mb-4 inline-flex items-center gap-1 border rounded px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        ← Back
      </button>

      {/* Title row: Title (left) + ":" overflow (right) */}
      <div className="flex items-start justify-between mb-4 relative">
        <h1 className="text-2xl sm:text-3xl font-bold">Flagged transactions</h1>

        <div className="relative" ref={menuRef}>
          <button
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="border rounded px-2 py-1.5 text-2xl leading-none hover:bg-gray-50"
            title="More"
          >
            :
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-lg z-10"
            >
              <button
                onClick={refreshAndCheck}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                role="menuitem"
              >
                {loading ? "Processing…" : "Batch"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls row: left filter, right search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="resolved" className="text-sm text-gray-600">
            Resolved status:
          </label>
          <select
            id="resolved"
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value as ResolvedFilter)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="false">Unresolved only</option>
            <option value="true">Resolved only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search reason / tx ids..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-64"
          />
        </div>
      </div>

      {/* Status banners */}
      {error && (
        <div className="mb-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 text-sm text-green-700 border border-green-200 bg-green-50 rounded px-3 py-2">
          {success}
        </div>
      )}
      {loading && !data.length && (
        <div className="mb-3 text-sm text-gray-600">Loading flagged transactions…</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-3 py-2 border-b">Flag ID</th>
              <th className="px-3 py-2 border-b">Created</th>
              <th className="px-3 py-2 border-b">Transaction IDs</th>
              <th className="px-3 py-2 border-b">Resolved</th>
              <th className="px-3 py-2 border-b">Reason</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={5}>
                  {loading ? "Loading…" : "No flagged transactions found."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.flagged_transaction_id} className="even:bg-gray-50">
                  <td className="px-3 py-2 border-b font-mono">{row.flagged_transaction_id}</td>
                  <td className="px-3 py-2 border-b">{formatWhen(row.created_at)}</td>
                  <td className="px-3 py-2 border-b">
                    <div className="flex flex-wrap gap-1">
                      {row.transaction_ids.length === 0 ? (
                        <span className="text-gray-500">—</span>
                      ) : (
                        row.transaction_ids.map((id) => (
                          <span
                            key={id}
                            className="inline-block font-mono text-xs border rounded px-1.5 py-0.5"
                          >
                            {id}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs " +
                        (row.is_resolved
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200")
                      }
                    >
                      {row.is_resolved ? "Resolved" : "Unresolved"}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b">
                    {row.reason ? row.reason : <span className="text-gray-500">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* API hint */}
      <div className="mt-3 text-[11px] text-gray-500">
        API: <code className="font-mono">{API_BASE}/transaction/flagged_transactions</code>
      </div>
    </div>
  );
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
