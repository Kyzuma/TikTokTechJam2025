// src/screens/UserDataScreen.jsx
import { useEffect, useMemo, useState } from "@lynx-js/react";
import { API_BASE } from '../App';

export function UserDataScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [batching, setBatching] = useState(false);
  const [verifying, setVerifying] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
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

  const fetchUsers = async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/user/user_profiles`, {
        headers: { Accept: "application/json" },
        signal,
        mode: "cors",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setUsers(data ?? []);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(`Request failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, []);

  const runBatchAndRefresh = async () => {
    try {
      setBatching(true);
      setError(null);
      setSuccess(null);
      
      const res = await fetch(`${API_BASE}/trust_log/tabulate_trust`, {
        headers: { Accept: "application/json" },
        mode: "cors",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const controller = new AbortController();
      await fetchUsers(controller.signal);
      setSuccess("Batch completed: trust scores & transaction limits recalculated.");
    } catch (e) {
      setError(`Batch failed: ${e.message}`);
    } finally {
      setBatching(false);
      setMenuOpen(false);
    }
  };

  const verifyUser = async (userId) => {
    try {
      setError(null);
      setSuccess(null);
      setVerifying((v) => ({ ...v, [userId]: true }));

      const res = await fetch(`${API_BASE}/user/verify?user_id=${userId}`, {
        headers: { Accept: "application/json" },
        mode: "cors",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      
      const { verified, new_trust } = data ?? {};
      // Update the row inline
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId
            ? {
                ...u,
                is_verified: !!verified,
                trust_score:
                  typeof new_trust === "number" ? new_trust : u.trust_score,
              }
            : u
        )
      );
      setSuccess(
        `User ${userId} ${verified ? "verified" : "status unchanged"}${
          typeof new_trust === "number" ? ` (trust → ${new_trust})` : ""
        }.`
      );
    } catch (e) {
      setError(`Verify failed: ${e.message}`);
    } finally {
      setVerifying((v) => {
        const { [userId]: _, ...rest } = v;
        return rest;
      });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = [
        String(u.user_id),
        u.created_at,
        u.is_verified ? "verified" : "not verified",
        u.last_ip ?? "",
        String(u.trust_score),
        String(u.transaction_limit),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [users, search]);

  const handleSearchInput = (e) => {
    setSearch(e.detail.value);
  };

  const handleRowClick = (row) => {
    console.log('User Row clicked:', row);
    setSelectedRow(row);
    setShowDetail(true);
  };

  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <view className="logs-container">
      {/* Title row */}
      <text className="logs-title">User Profiles</text>

      <text className="logs-subtitle">
        {users.length} profiles • {users.filter(u => u.is_verified).length} verified
      </text>

      {/* Controls row */}
      <view className="logs-controls">
        <view className="logs-filter">
          <text className="logs-label">Options:</text>
          <view className="user-data-menu-container">
            <text
              bindtap={() => setMenuOpen((v) => !v)}
              className="user-data-menu-button"
            >
              {menuOpen ? "Close ×" : "Batch ⋮"}
            </text>

            {menuOpen && (
              <view className="user-data-dropdown dropdown-base">
                <text
                  bindtap={() => {
                    if (!batching) runBatchAndRefresh();
                  }}
                  className={`dropdown-option ${batching ? "disabled" : ""}`}
                >
                  {batching ? "Processing…" : "Recalculate Trust"}
                </text>
              </view>
            )}
          </view>
        </view>

        <view className="logs-search">
          <input
            placeholder="Search by user, IP, status…"
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
      {loading && !users.length && (
        <view className="logs-loading">
          <text>Loading user profiles…</text>
        </view>
      )}

      {/* Table */}
      <view className="logs-table-container">
        <view className="logs-table">
          <view className="logs-table-header">
            <text className="logs-th">User ID</text>
            <text className="logs-th">Created At</text>
            <text className="logs-th">Verified</text>
            <text className="logs-th">Last IP</text>
            <text className="logs-th">Trust Score</text>
            <text className="logs-th">Tx Limit</text>
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
                  <text>{loading ? "Loading…" : "No user profiles found."}</text>
                </view>
              ) : (
                filtered.map((u) => (
                  <view
                    key={u.user_id}
                    className="logs-row logs-row-clickable"
                  >
                    <text 
                      className="logs-td logs-id"
                      bindtap={() => handleRowClick(u)}
                    >
                      {u.user_id}
                    </text>
                    <text 
                      className="logs-td"
                      bindtap={() => handleRowClick(u)}
                    >
                      {fmtDate(u.created_at)}
                    </text>
                    <view 
                      className="logs-td"
                      bindtap={() => handleRowClick(u)}
                    >
                      <text className={`logs-status ${
                        u.is_verified ? "logs-resolved" : "logs-unresolved"
                      }`}>
                        {u.is_verified ? "Verified" : "Not Verified"}
                      </text>
                    </view>
                    <text 
                      className="logs-td logs-id"
                      bindtap={() => handleRowClick(u)}
                    >
                      {u.last_ip || "—"}
                    </text>
                    <text 
                      className="logs-td user-data-trust-score"
                      bindtap={() => handleRowClick(u)}
                    >
                      {u.trust_score}
                    </text>
                    <text 
                      className="logs-td"
                      bindtap={() => handleRowClick(u)}
                    >
                      {u.transaction_limit}
                    </text>
                    <view className="logs-td">
                      {u.is_verified ? (
                        <text className="logs-empty">—</text>
                      ) : (
                        <text
                          bindtap={(e) => {
                            e.stopPropagation();
                            verifyUser(u.user_id);
                          }}
                          className={`user-data-verify-button ${verifying[u.user_id] ? "disabled" : ""}`}
                        >
                          {verifying[u.user_id] ? "Verifying…" : "Verify"}
                        </text>
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
                User Profile Details - User ID #{selectedRow.user_id}
              </text>
            </view>

            <view className="logs-modal-content">
              <view className="logs-detail-section">
                <text className="logs-detail-label">User ID:</text>
                <text className="logs-detail-value logs-id">{selectedRow.user_id}</text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Created At:</text>
                <text className="logs-detail-value">{fmtDate(selectedRow.created_at)}</text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Verification Status:</text>
                <view className="logs-detail-value">
                  <text className={`logs-status ${
                    selectedRow.is_verified ? "logs-resolved" : "logs-unresolved"
                  }`}>
                    {selectedRow.is_verified ? "Verified" : "Not Verified"}
                  </text>
                </view>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Last IP Address:</text>
                <text className="logs-detail-value logs-id">
                  {selectedRow.last_ip || "No IP recorded"}
                </text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Trust Score:</text>
                <text className="logs-detail-value user-data-trust-score-large">
                  {selectedRow.trust_score}
                </text>
              </view>

              <view className="logs-detail-section">
                <text className="logs-detail-label">Transaction Limit:</text>
                <text className="logs-detail-value">
                  ${selectedRow.transaction_limit?.toLocaleString() || 'N/A'}
                </text>
              </view>

              {!selectedRow.is_verified && (
                <view className="logs-detail-section">
                  <text className="logs-detail-label">Actions:</text>
                  <view className="logs-detail-value">
                    <text
                      bindtap={() => {
                        verifyUser(selectedRow.user_id);
                        setShowDetail(false);
                      }}
                      className="user-data-verify-button"
                    >
                      Verify User
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
