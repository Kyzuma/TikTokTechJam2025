// src/components/ConnectedIpsComp.jsx
import { useEffect, useMemo, useState } from "@lynx-js/react";
import { API_BASE } from '../App';

export default function ConnectedIpsComp() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [onlySuspicious, setOnlySuspicious] = useState(false);
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

  const fetchRows = async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/ip/current_connected_ips`, {
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
    fetchRows(controller.signal);
    return () => controller.abort();
  }, []);

  const copyIP = async (ip) => {
    try {
      await navigator.clipboard.writeText(ip);
      setSuccess(`Copied ${ip}`);
    } catch {
      setError("Could not copy IP to clipboard");
    }
  };

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

  const handleSearchInput = (e) => {
    setSearch(e.detail.value);
  };

  const handleRowClick = (row) => {
    console.log('Connected IP Row clicked:', row);
    setSelectedRow(row);
    setShowDetail(true);
  };

  return (
    <view className="logs-container">
      {/* Title row */}
        <text className="logs-title">Current Connected IPs</text>

        <text className="logs-subtitle">
          {rows.length} connected • {normalCount} normal
        </text>

        <text> </text>

      {/* Controls row */}
      <view className="logs-controls">
        <view className="logs-filter">
          <text className="logs-label">Show:</text>
          <text
            bindtap={() => setOnlySuspicious((v) => !v)}
            className={`connected-ips-filter-button ${onlySuspicious ? "active" : ""}`}
          >
            {onlySuspicious ? "Suspicious only" : "All IPs"}
          </text>
        </view>

        <view className="logs-search">
          <input
            placeholder="Search IP / user id..."
            value={search}
            bindinput={handleSearchInput}
            className="logs-search-input"
          />
        </view>

        <view className="logs-refresh">
          <text
            bindtap={() => {
              const controller = new AbortController();
              fetchRows(controller.signal);
            }}
            className="connected-ips-refresh-button"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </text>
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
          <text>Loading connected IPs…</text>
        </view>
      )}

      {/* Table */}
      <view className="logs-table-container">
        <view className="logs-table">
          <view className="logs-table-header">
            <text className="logs-th">ID</text>
            <text className="logs-th">IP Address</text>
            <text className="logs-th">User IDs</text>
            <text className="logs-th"># Users</text>
            <text className="logs-th">Status</text>
            <text className="logs-th">Actions</text>
          </view>

          <scroll-view
            className="logs-table-scroll"
            scroll-y="true"
            style="max-height: 400px;"
          >
            <view className="logs-table-body">
              {filtered.length === 0 ? (
                <view className="logs-no-data">
                  <text>{loading ? "Loading…" : "No connected IPs found."}</text>
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
                      className="logs-td logs-id"
                      bindtap={() => handleRowClick(r)}
                    >
                      {r.ip_address}
                    </text>
                    <view 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      {r.user_ids && r.user_ids.length > 0 ? (
                        <view className="connected-ips-user-list">
                          {r.user_ids.map((uid) => (
                            <text key={uid} className="connected-ips-user-chip">
                              {uid}
                            </text>
                          ))}
                        </view>
                      ) : (
                        <text className="logs-empty">—</text>
                      )}
                    </view>
                    <text 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      {r.user_ids?.length ?? 0}
                    </text>
                    <view 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      <text className={`logs-status ${
                        r.is_suspicious ? "logs-unresolved" : "logs-resolved"
                      }`}>
                        {r.is_suspicious ? "Suspicious" : "Normal"}
                      </text>
                    </view>
                    <view className="logs-td">
                      <text
                        bindtap={(e) => {
                          e.stopPropagation();
                          copyIP(r.ip_address);
                        }}
                        className="connected-ips-copy-button"
                      >
                        Copy IP
                      </text>
                    </view>
                  </view>
                ))
              )}
            </view>
          </scroll-view>
        </view>
      </view>

      {/* API hint */}
      <view className="connected-ips-api-info">
        <text>API: </text>
        <text className="connected-ips-api-url">{API_BASE}/ip/current_connected_ips</text>
      </view>

      {/* Detail Modal */}
      {showDetail && selectedRow && (
        <view className="logs-modal-overlay" bindtap={() => setShowDetail(false)}>
          <view className="logs-modal">
            <view className="logs-modal-header">
              <text className="logs-modal-title">
                Connected IP Details - ID #{selectedRow.id}
              </text>
            </view>

            <view className="logs-modal-content">
              <view className="logs-detail-section">
                <text className="logs-detail-label">IP Record ID:</text>
                <text className="logs-detail-value">{selectedRow.id}</text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">IP Address:</text>
                <text className="logs-detail-value logs-id">
                  {selectedRow.ip_address}
                </text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Connected Users:</text>
                <view className="logs-detail-value">
                  {selectedRow.user_ids && selectedRow.user_ids.length > 0 ? (
                    <view className="connected-ips-user-list-large">
                      {selectedRow.user_ids.map((uid) => (
                        <text key={uid} className="connected-ips-user-chip-large">
                          User {uid}
                        </text>
                      ))}
                    </view>
                  ) : (
                    <text>No users connected</text>
                  )}
                </view>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Number of Users:</text>
                <text className="logs-detail-value">
                  {selectedRow.user_ids?.length ?? 0} user{selectedRow.user_ids?.length !== 1 ? 's' : ''}
                </text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Status:</text>
                <view className="logs-detail-value">
                  <text className={`logs-status ${
                    selectedRow.is_suspicious ? "logs-unresolved" : "logs-resolved"
                  }`}>
                    {selectedRow.is_suspicious ? "Suspicious" : "Normal"}
                  </text>
                </view>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Actions:</text>
                <view className="logs-detail-value">
                  <text
                    bindtap={() => {
                      copyIP(selectedRow.ip_address);
                    }}
                    className="connected-ips-copy-button"
                  >
                    Copy IP Address
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>
      )}
    </view>
  );
}
