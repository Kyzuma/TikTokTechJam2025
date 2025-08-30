// src/screens/LogsScreen.jsx
import { useEffect, useMemo, useRef, useState } from "@lynx-js/react";

export function LogsScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resolvedFilter, setResolvedFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Detail modal state
  const [selectedRow, setSelectedRow] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const DEFAULT_BASE = "http://192.168.88.13:8080";
  const API_BASE = DEFAULT_BASE;

  // Alternative simpler request method for Lynx
  const fetchDataSimple = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Trying simple request to:", apiUrl);

      // Try a basic request without extra headers first
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log("Raw response text:", text);

      const result = JSON.parse(text);
      const normalized = (result || []).map((r) => ({
        ...r,
        transaction_ids: Array.isArray(r.transaction_ids)
          ? r.transaction_ids.map((n) => Number(n))
          : [],
      }));

      setData(normalized);
      console.log("Simple fetch successful:", normalized);
    } catch (e) {
      console.error("Simple fetch error:", e);
      setError(`Simple fetch failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Build URL with optional ?resolved=
  const apiUrl = useMemo(() => {
    let url = `${API_BASE}/transaction/flagged_transactions`;
    if (resolvedFilter !== "all") {
      url += `?resolved=${resolvedFilter}`;
    }
    return url;
  }, [resolvedFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Making request to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(
          `Request failed (${response.status}): ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Parsed result:", result);

      const normalized = (result || []).map((r) => ({
        ...r,
        transaction_ids: Array.isArray(r.transaction_ids)
          ? r.transaction_ids.map((n) => Number(n))
          : [],
      }));
      setData(normalized);
      console.log("Data set successfully:", normalized);
    } catch (e) {
      console.error("Fetch error:", e);
      setError(`Failed to fetch flagged transactions: ${e.message}`);
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

      console.log(
        "Making batch request to:",
        `${API_BASE}/transaction/check_transactions`
      );

      const response = await fetch(
        `${API_BASE}/transaction/check_transactions`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: "cors",
        }
      );

      console.log("Batch response:", response);

      if (!response.ok) {
        throw new Error(
          `Request failed (${response.status}): ${response.statusText}`
        );
      }

      setSuccess("Batch processing completed – flagged transactions updated.");
      await fetchData();
    } catch (e) {
      console.error("Batch request error:", e);
      setError(`Refresh failed: ${e.message}`);
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    console.log("LogsScreen mounted, trying requests...");

    // Try simple method first
    fetchDataSimple().catch(() => {
      console.log("Simple method failed, trying complex method...");
      fetchData();
    });
  }, [apiUrl]);

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

  const handleSearchInput = (e) => {
    setSearch(e.detail.value);
  };

  const handleFilterChange = (e) => {
    setResolvedFilter(e.detail.value);
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedRow(null);
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

  return (
    <view className="logs-container">
      {/* Title row */}
      <view className="logs-header">
        <text className="logs-title">Flagged Transactions</text>

        <view className="logs-menu">
          <text
            className="logs-menu-button"
            bindtap={() => setMenuOpen(!menuOpen)}
          >
            ⋮
          </text>

          {menuOpen && (
            <view className="logs-dropdown">
              <text className="logs-dropdown-item" bindtap={refreshAndCheck}>
                {loading ? "Processing…" : "Batch Process"}
              </text>
            </view>
          )}
        </view>
      </view>

      {/* Controls row */}
      <view className="logs-controls">
        <view className="logs-filter">
          <text className="logs-label">Resolved status:</text>
          <view
            range={["All", "Unresolved only", "Resolved only"]}
            value={
              resolvedFilter === "all" ? 0 : resolvedFilter === "false" ? 1 : 2
            }
            bindchange={handleFilterChange}
            className="logs-picker"
          >
            <text className="logs-picker-text">
              {resolvedFilter === "all"
                ? "All"
                : resolvedFilter === "false"
                ? "Unresolved only"
                : "Resolved only"}
            </text>
          </view>
        </view>

        <view className="logs-search">
          <input
            placeholder="Search reason / tx ids..."
            value={search}
            bindinput={handleSearchInput}
            className="logs-search-input"
          />
        </view>
      </view>

      {/* Status banners */}
      {error && (
        <view className="logs-error">
          <text>{error}</text>
        </view>
      )}
      {success && (
        <view className="logs-success">
          <text>{success}</text>
        </view>
      )}
      {loading && !data.length && (
        <view className="logs-loading">
          <text>Loading flagged transactions…</text>
        </view>
      )}

      {/* Table */}
      <view className="logs-table-container">
        <view className="logs-table">
          <view className="logs-table-header">
            <text className="logs-th">Flag ID</text>
            <text className="logs-th">Created</text>
            <text className="logs-th">Transaction IDs</text>
            <text className="logs-th">Resolved</text>
            <text className="logs-th">Reason</text>
          </view>

          <scroll-view 
            className="logs-table-scroll" 
            scroll-y="true"
            style="max-height: 400px;"
          >
            <view className="logs-table-body">
              {filtered.length === 0 ? (
                <view className="logs-no-data">
                  <text>
                    {loading ? "Loading…" : "No flagged transactions found."}
                  </text>
                </view>
              ) : (
                filtered.map((row) => (
                  <view 
                    key={row.flagged_transaction_id} 
                    className="logs-row logs-row-clickable"
                    bindtap={() => handleRowClick(row)}
                  >
                    <text className="logs-td logs-id">
                      {row.flagged_transaction_id}
                    </text>
                    <text className="logs-td">{formatWhen(row.created_at)}</text>
                    <view className="logs-td logs-tx-ids">
                      {row.transaction_ids.length === 0 ? (
                        <text className="logs-empty">—</text>
                      ) : (
                        row.transaction_ids.map((id) => (
                          <text key={id} className="logs-tx-id">
                            {id}
                          </text>
                        ))
                      )}
                    </view>
                    <view className="logs-td">
                      <text
                        className={`logs-status ${
                          row.is_resolved ? "logs-resolved" : "logs-unresolved"
                        }`}
                      >
                        {row.is_resolved ? "Resolved" : "Unresolved"}
                      </text>
                    </view>
                    <text className="logs-td logs-reason-preview">
                      {row.reason ? (row.reason.length > 30 ? row.reason.substring(0, 30) + "..." : row.reason) : "—"}
                    </text>
                  </view>
                ))
              )}
            </view>
          </scroll-view>
        </view>
      </view>

      {/* API hint */}
      <view className="logs-footer">
        <text className="logs-api-info">
          API: {API_BASE}/transaction/flagged_transactions
        </text>
      </view>

      {/* Detail Modal */}
      {showDetail && selectedRow && (
        <view className="logs-modal-overlay" bindtap={closeDetail}>
          <view className="logs-modal">
            <view className="logs-modal-header">
              <text className="logs-modal-title">
                Transaction Details - Flag ID #{selectedRow.flagged_transaction_id}
              </text>
            </view>
            
            <view className="logs-modal-content">
              <view className="logs-detail-section">
                <text className="logs-detail-label">Flag ID:</text>
                <text className="logs-detail-value">{selectedRow.flagged_transaction_id}</text>
              </view>
              
              <view className="logs-detail-section">
                <text className="logs-detail-label">Created:</text>
                <text className="logs-detail-value">{formatWhen(selectedRow.created_at)}</text>
              </view>
              
              <view className="logs-detail-section">
                <text className="logs-detail-label">Status:</text>
                <text className={`logs-status ${selectedRow.is_resolved ? 'logs-resolved' : 'logs-unresolved'}`}>
                  {selectedRow.is_resolved ? "Resolved" : "Unresolved"}
                </text>
              </view>
              
              <view className="logs-detail-section">
                <text className="logs-detail-label">Transaction IDs:</text>
                <view className="logs-detail-tx-list">
                  {selectedRow.transaction_ids.length === 0 ? (
                    <text className="logs-empty">No transaction IDs</text>
                  ) : (
                    selectedRow.transaction_ids.map((id) => (
                      <text key={id} className="logs-tx-id logs-tx-id-large">
                        {id}
                      </text>
                    ))
                  )}
                </view>
              </view>
              
              <view className="logs-detail-section logs-detail-reason">
                <text className="logs-detail-label">Reason:</text>
                <text className="logs-detail-value logs-reason-full">
                  {selectedRow.reason || "No reason provided"}
                </text>
              </view>
            </view>
          </view>
        </view>
      )}
    </view>
  );
};
