// src/screens/usersData.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

type UserProfile = {
  user_id: number;
  created_at: string;
  is_verified: boolean;
  last_ip?: string | null;
  trust_score: number;
  transaction_limit: number;
};

type VerifyResp = {
  user_id: number;
  new_trust: number;
  verified: boolean;
  message?: string;
};

const DEFAULT_BASE = "http://localhost:8080";
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || DEFAULT_BASE;

export default function UsersData() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // search + batch
  const [search, setSearch] = useState("");
  const [batching, setBatching] = useState(false);

  // per-row verify loading
  const [verifying, setVerifying] = useState<Record<number, boolean>>({});

  // overflow ":" menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ==== data ====
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<UserProfile[]>(
        `${API_BASE}/user/user_profiles`,
        { headers: { Accept: "application/json" } }
      );
      setUsers(res.data ?? []);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to fetch user profiles";
      setError(`Request failed${status ? ` (${status})` : ""}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const runBatchAndRefresh = async () => {
    try {
      setBatching(true);
      setError(null);
      setSuccess(null);
      await axios.get(`${API_BASE}/trust_log/tabulate_trust`, {
        headers: { Accept: "application/json" },
      });
      await fetchUsers();
      setSuccess(
        "Batch completed: trust scores & transaction limits recalculated."
      );
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to run trust recalculation";
      setError(`Batch failed${status ? ` (${status})` : ""}: ${msg}`);
    } finally {
      setBatching(false);
      setMenuOpen(false);
    }
  };

  // Verify a single user
  const verifyUser = async (userId: number) => {
    try {
      setError(null);
      setSuccess(null);
      setVerifying((v) => ({ ...v, [userId]: true }));

      const res = await axios.get<VerifyResp>(`${API_BASE}/user/verify`, {
        params: { user_id: userId },
        headers: { Accept: "application/json" },
      });

      const { verified, new_trust } = res.data ?? {};
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
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to verify user";
      setError(`Verify failed${status ? ` (${status})` : ""}: ${msg}`);
    } finally {
      setVerifying((v) => {
        const { [userId]: _, ...rest } = v;
        return rest;
      });
    }
  };

  // close ":" menu on outside click / ESC
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

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto p-6">
      {/* Title row: Title (left) + ":" overflow (right) */}
      <div className="flex items-start justify-between mb-4 relative">
        <h1 className="text-2xl sm:text-3xl font-bold">User Profiles</h1>

        <div className="relative" ref={menuRef}>
          <button
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="border rounded px-2 py-1.5 text-lg leading-none hover:bg-gray-50"
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
                onClick={runBatchAndRefresh}
                disabled={batching}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                role="menuitem"
              >
                {batching ? "Processing…" : "Batch"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls row (right: search only) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div /> {/* spacer */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by user, IP, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-72"
          />
        </div>
      </div>

      {/* Status banners */}
      {error && (
        <div className="mb-3 text-sm text-red-700 border border-red-200 bg-red-50 rounded px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 text-sm text-green-700 border border-green-200 bg-green-50 rounded px-3 py-2">
          {success}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-3 py-2 border-b">User ID</th>
              <th className="px-3 py-2 border-b">Created At</th>
              <th className="px-3 py-2 border-b">Verified</th>
              <th className="px-3 py-2 border-b">Last IP</th>
              <th className="px-3 py-2 border-b">Trust Score</th>
              <th className="px-3 py-2 border-b">Transaction Limit</th>
              <th className="px-3 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={7}>
                  {loading ? "Loading…" : "No user profiles found."}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.user_id} className="even:bg-gray-50">
                  <td className="px-3 py-2 border-b font-mono">{u.user_id}</td>
                  <td className="px-3 py-2 border-b">{fmtDate(u.created_at)}</td>
                  <td className="px-3 py-2 border-b">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs " +
                        (u.is_verified
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-gray-200 text-gray-600 border border-gray-300")
                      }
                    >
                      {u.is_verified ? "Verified" : "Not Verified"}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b">{u.last_ip || "—"}</td>
                  <td className="px-3 py-2 border-b font-bold">
                    {u.trust_score}
                  </td>
                  <td className="px-3 py-2 border-b">{u.transaction_limit}</td>
                  <td className="px-3 py-2 border-b">
                    {u.is_verified ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <button
                        onClick={() => verifyUser(u.user_id)}
                        disabled={!!verifying[u.user_id]}
                        className="inline-flex items-center gap-2 rounded px-2.5 py-1.5 text-xs border bg-white hover:bg-gray-50 disabled:opacity-60"
                        title="Verify user"
                      >
                        {verifying[u.user_id] ? "Verifying…" : "Verify"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* API hints (optional) */}
      <div className="mt-3 text-[11px] text-gray-500 space-y-1">
        <div>
          List: <code className="font-mono">{API_BASE}/user/user_profiles</code>
        </div>
        <div>
          Verify (GET):{" "}
          <code className="font-mono">
            {API_BASE}/user/verify?user_id=&lt;id&gt;
          </code>
        </div>
        <div>
          Batch:{" "}
          <code className="font-mono">{API_BASE}/trust_log/tabulate_trust</code>
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
