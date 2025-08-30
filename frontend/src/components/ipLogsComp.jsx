// src/components/ipLogsComp.jsx
import { useEffect, useMemo, useState } from "@lynx-js/react";
import { API_BASE } from "../App";

export default function IpLogsComp() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [suspicious, setSuspicious] = useState("all"); // "all" | "true" | "false"
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // Filter dropdown state
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

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
      if (e.name === "AbortError") return;
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
        method: "PUT",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      setSuccess(`IP log ${logId} marked as safe successfully.`);
      // Refresh logs after marking safe
      fetchLogs();
    } catch (e) {
      setError(`Failed to mark safe (ID: ${logId}) → ${e.message}`);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.id} ${r.user_id} ${r.ip_address} ${r.country ?? ""} ${
        r.region ?? ""
      } ${r.city ?? ""} ${r.remarks ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const handleSearchInput = (e) => {
    setSearch(e.detail.value);
  };

  const handleFilterSelect = (filterValue) => {
    setSuspicious(filterValue);
    setFilterDropdownOpen(false);
  };

  const getFilterDisplayText = () => {
    switch (suspicious) {
      case "all":
        return "All";
      case "true":
        return "Suspicious only";
      case "false":
        return "Non-suspicious";
      default:
        return "All";
    }
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
    console.log('IP Row clicked:', row);
    setSelectedRow(row);
    setShowDetail(true);
  };

  const closeDetail = (e) => {
    // Only close if clicking the overlay, not the modal content
    if (e.target.className === "logs-modal-overlay") {
      setShowDetail(false);
      setSelectedRow(null);
    }
  };

  return (
    <view className="logs-container">
      {/* Title row */}
      <view className="logs-header">
        <text className="logs-title">IP Access Logs</text>
      </view>

      {/* Controls row */}
      <view className="logs-controls">
        <view className="logs-filter">
          <text className="logs-label">Show:</text>
          <view className="logs-picker-container">
            <view
              className="logs-picker"
              bindtap={() => setFilterDropdownOpen(!filterDropdownOpen)}
            >
              <view className="logs-picker-display">
                <text className="logs-picker-text">
                  {getFilterDisplayText()}
                </text>
                <text className="logs-picker-arrow">▼</text>
              </view>
            </view>

            {filterDropdownOpen && (
              <view className="logs-filter-dropdown">
                <text
                  className={`logs-filter-option ${
                    suspicious === "all" ? "active" : ""
                  }`}
                  bindtap={() => handleFilterSelect("all")}
                >
                  All
                </text>
                <text
                  className={`logs-filter-option ${
                    suspicious === "true" ? "active" : ""
                  }`}
                  bindtap={() => handleFilterSelect("true")}
                >
                  Suspicious only
                </text>
                <text
                  className={`logs-filter-option ${
                    suspicious === "false" ? "active" : ""
                  }`}
                  bindtap={() => handleFilterSelect("false")}
                >
                  Non-suspicious
                </text>
              </view>
            )}
          </view>
        </view>

        <view className="logs-search">
          <input
            placeholder="Search IP / user / country / remarks..."
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
            <text
              className="logs-banner-close"
              bindtap={() => setSuccess(null)}
            >
              ✕
            </text>
          </view>
        </view>
      )}
      {loading && !rows.length && (
        <view className="logs-loading">
          <text>Loading IP logs…</text>
        </view>
      )}

      {/* Table */}
      <view className="logs-table-container">
        <view className="logs-table">
          <view className="logs-table-header">
            <text className="logs-th">ID</text>
            <text className="logs-th">Checked at</text>
            <text className="logs-th">User</text>
            <text className="logs-th">IP Address</text>
            <text className="logs-th">Location</text>
            <text className="logs-th">Status</text>
            <text className="logs-th">Action</text>
          </view>

          <scroll-view
            className="logs-table-scroll"
            scroll-y="true"
            style="max-height: 400px;"
          >
            <view className="logs-table-body">
              {filtered.length === 0 ? (
                <view className="logs-no-data">
                  <text>{loading ? "Loading…" : "No IP logs found."}</text>
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
                      {formatWhen(r.checked_at)}
                    </text>
                    <text 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      {r.user_id}
                    </text>
                    <text 
                      className="logs-td logs-id"
                      bindtap={() => handleRowClick(r)}
                    >
                      {r.ip_address}
                    </text>
                    <text 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      {[r.city, r.region, r.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </text>
                    <view 
                      className="logs-td"
                      bindtap={() => handleRowClick(r)}
                    >
                      <text
                        className={`logs-status ${
                          r.is_suspicious ? "logs-unresolved" : "logs-resolved"
                        }`}
                      >
                        {r.is_suspicious ? "Suspicious" : "OK"}
                      </text>
                    </view>
                    <view className="logs-td">
                      {r.is_suspicious ? (
                        <text
                          bindtap={(e) => {
                            e.stopPropagation(); // Prevent row click when clicking Mark Safe
                            markSafe(r.id);
                          }}
                          className="ip-logs-mark-safe-button"
                        >
                          Mark Safe
                        </text>
                      ) : (
                        <text className="logs-empty">—</text>
                      )}
                    </view>
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
                IP Access Details - Log ID #{selectedRow.id}
              </text>
            </view>

            <view className="logs-modal-content">
              <view className="logs-detail-section">
                <text className="logs-detail-label">Log ID:</text>
                <text className="logs-detail-value">{selectedRow.id}</text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Checked At:</text>
                <text className="logs-detail-value">
                  {formatWhen(selectedRow.checked_at)}
                </text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">User ID:</text>
                <text className="logs-detail-value">{selectedRow.user_id}</text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">IP Address:</text>
                <text className="logs-detail-value logs-id">
                  {selectedRow.ip_address}
                </text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Location:</text>
                <text className="logs-detail-value">
                  {[selectedRow.city, selectedRow.region, selectedRow.country]
                    .filter(Boolean)
                    .join(", ") || "Unknown location"}
                </text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Status:</text>
                <view className="logs-detail-value">
                  <text
                    className={`logs-status ${
                      selectedRow.is_suspicious
                        ? "logs-unresolved"
                        : "logs-resolved"
                    }`}
                  >
                    {selectedRow.is_suspicious ? "Suspicious" : "OK"}
                  </text>
                </view>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Remarks:</text>
                <text className="logs-detail-value logs-detail-remarks">
                  {selectedRow.remarks || "No remarks provided"}
                </text>
              </view>

              {selectedRow.is_suspicious && (
                <view className="logs-detail-section">
                  <text className="logs-detail-label">Action:</text>
                  <view className="logs-detail-value">
                    <text
                      bindtap={() => {
                        markSafe(selectedRow.id);
                        setShowDetail(false);
                      }}
                      className="ip-logs-mark-safe-button"
                    >
                      Mark as Safe
                    </text>
                  </view>
                </view>
              )}
            </view>
          </view>
        </view>
      )}
    </view>
  );
}
