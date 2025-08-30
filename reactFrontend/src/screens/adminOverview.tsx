import type { FC } from "react";
import { Link, useSearchParams } from "react-router-dom";

const AdminOverview: FC = () => {
    const [params] = useSearchParams();
    const userId = params.get("userId") ?? "admin-001";

    return (
        <div className="min-h-screen flex items-start sm:items-center justify-center p-4 sm:p-6 lg:p-10">
            <main
                className="
          w-full mx-auto space-y-6
          max-w-[520px] sm:max-w-[680px] lg:max-w-[820px]
        "
                role="main"
            >
                {/* User ID */}
                <section>
                    <div className="text-[11px] sm:text-[12px] uppercase tracking-wide text-gray-500">
                        User ID
                    </div>
                    <div className="mt-1 inline-flex items-center gap-2 font-bold text-base sm:text-lg">
                        <span
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 ring-1 ring-emerald-200"
                            title="Current user"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"
                                    fill="#047857"
                                />
                            </svg>
                            {userId}
                        </span>
                    </div>
                </section>

                {/* Cards wrapper */}
                <div className="grid gap-3">

                    {/* Transactions */}
                    <Link
                        to="/flaggedTransactions"
                        className="
              group w-full
              flex items-center justify-between
              rounded-2xl border border-gray-200 bg-white
              p-3 sm:p-4
              shadow-sm transition hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-emerald-400/50
            "
                        aria-label="Go to Transactions"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="rounded-xl bg-emerald-50 p-2 ring-1 ring-emerald-200"
                                aria-hidden="true"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="5" width="18" height="14" rx="3" fill="#d1fae5" stroke="#34d399" />
                                    <rect x="5" y="9" width="14" height="2" rx="1" fill="#34d399" />
                                    <rect x="5" y="13" width="6" height="2" rx="1" fill="#34d399" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-base sm:text-lg">
                                    Transactions
                                </div>
                                <div className="text-sm sm:text-[15px] text-gray-500">
                                    View flagged transactions and status
                                </div>
                            </div>
                        </div>
                        <div
                            className="text-gray-400 transition group-hover:text-emerald-500"
                            aria-hidden="true"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                    </Link>

                    {/* Logs */}
                    <Link
                        to="/logs"
                        className="
              group w-full
              flex items-center justify-between
              rounded-2xl border border-gray-200 bg-white
              p-3 sm:p-4
              shadow-sm transition hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-emerald-400/50
            "
                        aria-label="Go to Users"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="rounded-xl bg-emerald-50 p-2 ring-1 ring-emerald-200"
                                aria-hidden="true"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path d="M16 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" fill="#d1fae5" stroke="#34d399" />
                                    <path d="M3 19c0-3.314 4.03-6 9-6s9 2.686 9 6v1H3v-1Z" fill="#d1fae5" stroke="#34d399" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-base sm:text-lg">
                                    Logs history
                                </div>
                                <div className="text-sm sm:text-[15px] text-gray-500">
                                    Browse logs: trust logs, ip logs
                                </div>
                            </div>
                        </div>
                        <div
                            className="text-gray-400 transition group-hover:text-emerald-500"
                            aria-hidden="true"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                    </Link>

                    {/* Manage users */}
                    <Link
                        to="/usersData"
                        className="
                            group w-full
                            flex items-center justify-between
                            rounded-2xl border border-gray-200 bg-white
                            p-3 sm:p-4
                            shadow-sm transition hover:shadow-md
                            focus:outline-none focus:ring-2 focus:ring-emerald-400/50
                            "
                        aria-label="Go to Users"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="rounded-xl bg-emerald-50 p-2 ring-1 ring-emerald-200"
                                aria-hidden="true"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path d="M16 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" fill="#d1fae5" stroke="#34d399" />
                                    <path d="M3 19c0-3.314 4.03-6 9-6s9 2.686 9 6v1H3v-1Z" fill="#d1fae5" stroke="#34d399" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-base sm:text-lg">
                                    Manage users
                                </div>
                                <div className="text-sm sm:text-[15px] text-gray-500">
                                    Browse logs: user profile
                                </div>
                            </div>
                        </div>
                        <div
                            className="text-gray-400 transition group-hover:text-emerald-500"
                            aria-hidden="true"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default AdminOverview;
