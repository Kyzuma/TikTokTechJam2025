// src/components/ipLogsComp.jsx
import { useEffect, useMemo, useState } from "@lynx-js/react";

const DEFAULT_BASE = "http://localhost:8080";
const API_BASE = DEFAULT_BASE;

export default function IpLogsComp() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [suspicious, setSuspicious] = useState("all"); // "all" | "true" | "false"

  const apiUrl = useMemo(() => {
    const url = new URL("/ip/ip_logs", API_BASE);
    if (suspicious !== "all") url.searchParams.set("suspicious", suspicious);
    return url.toString();
  }, [suspicious]);

  const fetchLogs = async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl);
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
  }, [apiUrl]);

  const markSafe = async (logId) => {
    try {
      const res = await fetch(`${API_BASE}/ip/mark_safe/${logId}`, {
        method: 'PUT',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      // Refresh logs after marking safe
      fetchLogs();
    } catch (e) {
      alert(`Failed to mark safe (ID: ${logId}) → ${e.message}`);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.id} ${r.user_id} ${r.ip_address} ${r.country ?? ""} ${r.region ?? ""} ${r.city ?? ""} ${r.remarks ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  return (
    <view className="ip-logs-container">
      {/* Controls */}
      <view className="ip-logs-controls">
        <view className="ip-logs-controls-left">
          <text className="ip-logs-label">Show:</text>
          <picker
            value={suspicious}
            bindchange={(e) => setSuspicious(e.detail.value)}
            className="ip-logs-picker"
          >
            <picker-view-column>
              <view value="all">All</view>
              <view value="true">Suspicious only</view>
              <view value="false">Non-suspicious</view>
            </picker-view-column>
          </picker>
        </view>

        <view className="ip-logs-controls-right">
          <input
            type="text"
            placeholder="Search IP / user / country / remarks..."
            value={search}
            bindinput={(e) => setSearch(e.detail.value)}
            className="ip-logs-search-input"
          />
        </view>
      </view>

      {/* Error/Loading */}
      {error && (
        <view className="ip-logs-error">
          <text>{error}</text>
        </view>
      )}
      {loading && !rows.length && (
        <view className="ip-logs-loading">
          <text>Loading IP logs…</text>
        </view>
      )}

      {/* Table */}
      <scroll-view className="ip-logs-table-container" scroll-x>
        <view className="ip-logs-table">
          {/* Table Header */}
          <view className="ip-logs-header">
            <text className="ip-logs-header-cell ip-logs-col-id">ID</text>
            <text className="ip-logs-header-cell ip-logs-col-checked">Checked at</text>
            <text className="ip-logs-header-cell ip-logs-col-user">User</text>
            <text className="ip-logs-header-cell ip-logs-col-ip">IP</text>
            <text className="ip-logs-header-cell ip-logs-col-geo">Geo</text>
            <text className="ip-logs-header-cell ip-logs-col-coords">Lat/Lng</text>
            <text className="ip-logs-header-cell ip-logs-col-status">Status</text>
            <text className="ip-logs-header-cell ip-logs-col-remarks">Remarks</text>
            <text className="ip-logs-header-cell ip-logs-col-action">Action</text>
          </view>
          
          {/* Table Body */}
          {filtered.length === 0 ? (
            <view className="ip-logs-no-data">
              <text>{loading ? "Loading…" : "No IP logs found."}</text>
            </view>
          ) : (
            filtered.map((r, index) => (
              <view key={r.id} className={`ip-logs-row ${index % 2 === 1 ? 'ip-logs-row-even' : ''}`}>
                <text className="ip-logs-cell ip-logs-col-id ip-logs-mono">{r.id}</text>
                <text className="ip-logs-cell ip-logs-col-checked">{fmtDate(r.checked_at)}</text>
                <text className="ip-logs-cell ip-logs-col-user">{r.user_id}</text>
                <text className="ip-logs-cell ip-logs-col-ip ip-logs-mono">{r.ip_address}</text>
                <text className="ip-logs-cell ip-logs-col-geo">
                  {[r.city, r.region, r.country].filter(Boolean).join(", ") || "—"}
                </text>
                <text className="ip-logs-cell ip-logs-col-coords">
                  {isNum(r.latitude) && isNum(r.longitude)
                    ? `${r.latitude}, ${r.longitude}`
                    : "—"}
                </text>
                <view className="ip-logs-cell ip-logs-col-status">
                  <text className={`ip-logs-status-badge ${
                    r.is_suspicious
                      ? "ip-logs-suspicious"
                      : "ip-logs-safe"
                  }`}>
                    {r.is_suspicious ? "Suspicious" : "OK"}
                  </text>
                </view>
                <text className="ip-logs-cell ip-logs-col-remarks">
                  {r.remarks ? r.remarks : "—"}
                </text>
                <view className="ip-logs-cell ip-logs-col-action">
                  {r.is_suspicious ? (
                    <text
                      bindtap={() => markSafe(r.id)}
                      className="ip-logs-mark-safe-button"
                    >
                      Mark Safe
                    </text>
                  ) : (
                    <text className="ip-logs-no-action">—</text>
                  )}
                </view>
              </view>
            ))
          )}
        </view>
      </scroll-view>

      <view className="ip-logs-api-info">
        <text>API: </text>
        <text className="ip-logs-api-url">{API_BASE}/ip/ip_logs</text>
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

function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}
