// src/components/trustLogsComp.jsx
import { useEffect, useMemo, useState } from "@lynx-js/react";

const DEFAULT_BASE = "http://localhost:8080";
const API_BASE = DEFAULT_BASE; // Since import.meta doesn't work in Lynx

export default function TrustLogsComp() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const apiUrl = `${API_BASE}/trust_log/trust_logs`;

  const fetchLogs = async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
        signal,
        mode: "cors",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setRows(data ?? []);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(`Request failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchLogs(controller.signal);
    return () => controller.abort();
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
    <view className="trust-logs-container">
      {/* Controls */}
      <view className="trust-logs-controls">
        <view className="trust-logs-controls-group">
          <input
            type="text"
            placeholder="Search user / remarks..."
            value={search}
            bindinput={(e) => setSearch(e.detail.value)}
            className="trust-logs-search-input"
          />
          <text
            bindtap={() => setSortNewestFirst((v) => !v)}
            className="trust-logs-sort-button"
          >
            {sortNewestFirst ? "Newest → Oldest" : "Oldest → Newest"}
          </text>
        </view>
      </view>

      {/* Error/Loading */}
      {error && (
        <view className="trust-logs-error">
          <text>{error}</text>
        </view>
      )}
      {loading && !rows.length && (
        <view className="trust-logs-loading">
          <text>Loading trust activity…</text>
        </view>
      )}

      {/* Table */}
      <scroll-view className="trust-logs-table-container" scroll-x>
        <view className="trust-logs-table">
          {/* Table Header */}
          <view className="trust-logs-header">
            <text className="trust-logs-header-cell trust-logs-col-id">Log ID</text>
            <text className="trust-logs-header-cell trust-logs-col-created">Created</text>
            <text className="trust-logs-header-cell trust-logs-col-user">User ID</text>
            <text className="trust-logs-header-cell trust-logs-col-trust">Δ Trust</text>
            <text className="trust-logs-header-cell trust-logs-col-remarks">Remarks</text>
          </view>
          
          {/* Table Body */}
          {filtered.length === 0 ? (
            <view className="trust-logs-no-data">
              <text>{loading ? "Loading…" : "No trust logs found."}</text>
            </view>
          ) : (
            filtered.map((r, index) => (
              <view key={r.id} className={`trust-logs-row ${index % 2 === 1 ? 'trust-logs-row-even' : ''}`}>
                <text className="trust-logs-cell trust-logs-col-id trust-logs-mono">{r.id}</text>
                <text className="trust-logs-cell trust-logs-col-created">{fmtDate(r.created_at)}</text>
                <text className="trust-logs-cell trust-logs-col-user">{r.user_id}</text>
                <view className="trust-logs-cell trust-logs-col-trust">
                  <text className={`trust-logs-badge ${
                    r.added_trust > 0
                      ? "trust-logs-positive"
                      : r.added_trust < 0
                      ? "trust-logs-negative"
                      : "trust-logs-neutral"
                  }`}>
                    {r.added_trust > 0 ? `+${r.added_trust}` : r.added_trust}
                  </text>
                </view>
                <text className="trust-logs-cell trust-logs-col-remarks">
                  {r.remarks || "—"}
                </text>
              </view>
            ))
          )}
        </view>
      </scroll-view>

      {/* API hint */}
      <view className="trust-logs-api-info">
        <text>API: </text>
        <text className="trust-logs-api-url">{API_BASE}/trust_log/trust_logs</text>
      </view>
    </view>
  );
}

// helpers
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
