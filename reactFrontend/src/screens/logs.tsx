import { useState } from "react";

import IpLogsComp from "../components/ipLogsComp";
import TrustLogsComp from "../components/trustLogsComp";

export default function UserDetails() {
    const [activeTab, setActiveTab] = useState<"trust" | "ip">("trust");

    return (
        <div className="min-h-screen w-full max-w-4xl mx-auto p-6">
            {/* Page Title */}
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Logs</h1>

            {/* Tabs */}
            <div className="grid grid-cols-2 rounded-lg overflow-hidden border mb-6">
                <button
                    onClick={() => setActiveTab("trust")}
                    className={`py-3 text-center font-medium ${activeTab === "trust"
                        ? "bg-amber-100 text-black"
                        : "bg-gray-100 text-gray-500 hover:text-black"
                        }`}
                >
                    Trust scores
                </button>
                <button
                    onClick={() => setActiveTab("ip")}
                    className={`py-3 text-center font-medium ${activeTab === "ip"
                        ? "bg-amber-100 text-black"
                        : "bg-gray-100 text-gray-500 hover:text-black"
                        }`}
                >
                    IP logs
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "trust" && (
                    <div className="p-4 border rounded bg-white">
                        {/* Replace with Trust Scores component */}
                        <div className="p-4 border rounded bg-white">
                            <p className="text-gray-700 mb-3">Trust logs:</p>
                            <TrustLogsComp />
                        </div>
                    </div>
                )}
                {activeTab === "ip" && (
                    <div className="p-4 border rounded bg-white">
                        <p className="text-gray-700 mb-3">Recent IP logs:</p>
                        <IpLogsComp />
                    </div>
                )}
            </div>
        </div>
    );
}
