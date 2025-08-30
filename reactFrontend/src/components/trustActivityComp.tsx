// // src/components/trustScore.tsx
// import { useEffect, useState } from "react";
// import axios from "axios";

// // Match your backend's user_profile table structure
// type UserProfile = {
//   user_id: number;
//   created_at: string;
//   is_verified: boolean;
//   last_ip?: string | null;
//   trust_score: number;
//   transaction_limit: number;
// };

// // Base URL: defaults to http://localhost:8080 (from backend swagger config)
// const DEFAULT_BASE = "http://localhost:8080";
// const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || DEFAULT_BASE;

// export default function TrustScore() {
//   const [users, setUsers] = useState<UserProfile[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const res = await axios.get<UserProfile[]>(
//         `${API_BASE}/user/user_profiles`,
//         { headers: { Accept: "application/json" } }
//       );
//       setUsers(res.data ?? []);
//     } catch (e: any) {
//       const status = e?.response?.status;
//       const msg =
//         e?.response?.data?.error ||
//         e?.response?.data?.message ||
//         e?.message ||
//         "Failed to fetch user profiles";
//       setError(`Request failed${status ? ` (${status})` : ""}: ${msg}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   return (
//     <div className="w-full">
//       {/* Controls */}
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-lg font-semibold">User Profiles</h2>
//         <button
//           onClick={fetchUsers}
//           disabled={loading}
//           className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
//         >
//           {loading ? "Refreshing..." : "Refresh"}
//         </button>
//       </div>

//       {/* Error */}
//       {error && (
//         <div className="mb-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded px-3 py-2">
//           {error}
//         </div>
//       )}

//       {/* Table */}
//       <div className="overflow-x-auto border rounded">
//         <table className="min-w-full text-sm">
//           <thead className="bg-gray-100">
//             <tr className="text-left">
//               <th className="px-3 py-2 border-b">User ID</th>
//               <th className="px-3 py-2 border-b">Created At</th>
//               <th className="px-3 py-2 border-b">Verified</th>
//               <th className="px-3 py-2 border-b">Last IP</th>
//               <th className="px-3 py-2 border-b">Trust Score</th>
//               <th className="px-3 py-2 border-b">Transaction Limit</th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.length === 0 ? (
//               <tr>
//                 <td className="px-3 py-3 text-gray-500" colSpan={6}>
//                   {loading ? "Loading…" : "No user profiles found."}
//                 </td>
//               </tr>
//             ) : (
//               users.map((u) => (
//                 <tr key={u.user_id} className="even:bg-gray-50">
//                   <td className="px-3 py-2 border-b font-mono">{u.user_id}</td>
//                   <td className="px-3 py-2 border-b">{fmtDate(u.created_at)}</td>
//                   <td className="px-3 py-2 border-b">
//                     <span
//                       className={
//                         "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs " +
//                         (u.is_verified
//                           ? "bg-green-100 text-green-700 border border-green-200"
//                           : "bg-gray-200 text-gray-600 border border-gray-300")
//                       }
//                     >
//                       {u.is_verified ? "Verified" : "Not Verified"}
//                     </span>
//                   </td>
//                   <td className="px-3 py-2 border-b">{u.last_ip || "—"}</td>
//                   <td className="px-3 py-2 border-b font-bold">{u.trust_score}</td>
//                   <td className="px-3 py-2 border-b">{u.transaction_limit}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* API hint */}
//       <div className="mt-3 text-[11px] text-gray-500">
//         API: <code className="font-mono">{API_BASE}/user/user_profiles</code>
//       </div>
//     </div>
//   );
// }

// // helper
// function fmtDate(iso: string) {
//   try {
//     const d = new Date(iso);
//     if (Number.isNaN(d.getTime())) return iso;
//     return d.toLocaleString();
//   } catch {
//     return iso;
//   }
// }
