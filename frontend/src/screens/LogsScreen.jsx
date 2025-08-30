import { useState } from "@lynx-js/react";
import { API_BASE } from '../App';

import IpLogsComp from "../components/ipLogsComp";
import TrustLogsComp from "../components/trustLogsComp";

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

  // Auto-clear timers for banners
  const errorTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

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
            {/* Page Title */}
            <text className="logs-title">Logs</text>

            {/* Tabs */}
            <view className="logs-tabs">
                <text
                    bindtap={() => setActiveTab("trust")}
                    className={`logs-tab ${activeTab === "trust" ? "logs-tab-active" : ""}`}
                >
                    Trust scores
                </text>
                <text
                    bindtap={() => setActiveTab("ip")}
                    className={`logs-tab ${activeTab === "ip" ? "logs-tab-active" : ""}`}
                >
                    IP logs
                </text>
            </view>

            {/* Tab Content */}
            <view className="logs-content">
                {activeTab === "trust" && (
                    <view className="logs-panel">
                        <text className="logs-subtitle">Trust logs:</text>
                        <TrustLogsComp />
                    </view>
                )}
                {activeTab === "ip" && (
                    <view className="logs-panel">
                        <text className="logs-subtitle">Recent IP logs:</text>
                        <IpLogsComp />
                    </view>
                )}
            </view>
        </view>
    );
}
