// src/components/trustLogsComp.jsx
import { useEffect, useMemo, useState } from "@lynx-js/react";
import { API_BASE } from '../App';

export default function TrustLogsComp() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // Auto-clear timers for banners
  const errorTimeoutRef = useState(null);
  const successTimeoutRef = useState(null);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);

  // Auto-clear success after 3 seconds
  useEffect(() => {
    if (success) {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [success]);

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

  const handleSearchInput = (e) => {
    setSearch(e.detail.value);
  };

  const formatWhen = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const handleRowClick = (row) => {
    console.log('Row clicked:', row);
    setSelectedRow(row);
    setShowDetail(true);
  };

  return (
    <view className="logs-container">
      {/* Title row */}
      <view className="logs-header">
        <text className="logs-subtitle">Trust Activity Logs</text>
      </view>

      {/* Controls row */}
      <view className="logs-controls">
        <view className="logs-filter">
          <text className="logs-label">Sort:</text>
          <text
            bindtap={() => setSortNewestFirst((v) => !v)}
            className="trust-logs-sort-button"
          >
            {sortNewestFirst ? "Newest → Oldest" : "Oldest → Newest"}
          </text>
        </view>

        <view className="logs-search">
          <input
            placeholder="Search user / remarks..."
            value={search}
            bindinput={handleSearchInput}
            className="logs-search-input"
          />
        </view>
      </view>

      {/* Status banners */}
      {error && (
        <view className="logs-error">
          <view className="logs-banner-content">
            <text className="logs-banner-text">{error}</text>
            <text className="logs-banner-close" bindtap={() => setError(null)}>
              ✕
            </text>
          </view>
        </view>
      )}
      {success && (
        <view className="logs-success">
          <view className="logs-banner-content">
            <text className="logs-banner-text">{success}</text>
            <text className="logs-banner-close" bindtap={() => setSuccess(null)}>
              ✕
            </text>
          </view>
        </view>
      )}
      {loading && !rows.length && (
        <view className="logs-loading">
          <text>Loading trust activity…</text>
        </view>
      )}

      {/* Table */}
      <view className="logs-table-container">
        <view className="logs-table">
          <view className="logs-table-header">
            <text className="logs-th">Log ID</text>
            <text className="logs-th">Created</text>
            <text className="logs-th">User ID</text>
            <text className="logs-th">Trust Change</text>
            <text className="logs-th">Remarks</text>
          </view>

          <scroll-view
            className="logs-table-scroll"
            scroll-y="true"
            style="max-height: 400px;"
          >
            <view className="logs-table-body">
              {filtered.length === 0 ? (
                <view className="logs-no-data">
                  <text>{loading ? "Loading…" : "No trust logs found."}</text>
                </view>
              ) : (
                filtered.map((r) => (
                  <view 
                    key={r.id} 
                    className="logs-row logs-row-clickable"
                  >
                    <text 
                      className="logs-td logs-id"
                      bindtap={() => handleRowClick(r)}
                    >
                      {r.id}
                    </text>
                    <text 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      {formatWhen(r.created_at)}
                    </text>
                    <text 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      {r.user_id}
                    </text>
                    <view 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      <text className={`logs-status ${
                        r.added_trust > 0
                          ? "trust-logs-positive"
                          : r.added_trust < 0
                          ? "trust-logs-negative"
                          : "trust-logs-neutral"
                      }`}>
                        {r.added_trust > 0 ? `+${r.added_trust}` : r.added_trust}
                      </text>
                    </view>
                    <text 
                      className="logs-td logs-reason-preview"
                      bindtap={() => handleRowClick(r)}
                    >
                      {r.remarks ? (r.remarks.length > 30 ? r.remarks.substring(0, 30) + "..." : r.remarks) : "—"}
                    </text>
                  </view>
                ))
              )}
            </view>
          </scroll-view>
        </view>
      </view>

      {/* Detail Modal */}
      {showDetail && selectedRow && (
        <view className="logs-modal-overlay" bindtap={() => setShowDetail(false)}>
          <view className="logs-modal">
            <view className="logs-modal-header">
              <text className="logs-modal-title">
                Trust Log Details - Log ID #{selectedRow.id}
              </text>
            </view>
            
            <view className="logs-modal-content">
              <view className="logs-detail-section">
                <text className="logs-detail-label">Log ID:</text>
                <text className="logs-detail-value">{selectedRow.id}</text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Created:</text>
                <text className="logs-detail-value">{formatWhen(selectedRow.created_at)}</text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">User ID:</text>
                <text className="logs-detail-value">{selectedRow.user_id}</text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Trust Score Change:</text>
                <view className="logs-detail-value">
                  <text className={`logs-status ${
                    selectedRow.added_trust > 0
                      ? "trust-logs-positive"
                      : selectedRow.added_trust < 0
                      ? "trust-logs-negative"
                      : "trust-logs-neutral"
                  }`}>
                    {selectedRow.added_trust > 0 ? `+${selectedRow.added_trust}` : selectedRow.added_trust}
                  </text>
                </view>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Remarks:</text>
                <text className="logs-detail-value logs-detail-remarks">
                  {selectedRow.remarks || "No remarks provided"}
                </text>
              </view>
            </view>
          </view>
        </view>
      )}
    </view>
  );
}
