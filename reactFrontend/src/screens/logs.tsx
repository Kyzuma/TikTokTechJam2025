import { useState } from "react";

import IpLogsComp from "../components/ipLogsComp";
import TrustLogsComp from "../components/trustLogsComp";
import CurrentConnectIP from "../components/currentConnectedIpComp";

type TabKey = "trust" | "ip" | "current";

export default function UserDetails() {
  const [activeTab, setActiveTab] = useState<TabKey>("trust");

  const tabs: { id: TabKey; label: string }[] = [
    { id: "trust", label: "Trust logs" },
    { id: "ip", label: "IP logs" },
    { id: "current", label: "Current connected IPs" },
  ];

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto p-6">
      {/* Page Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Logs</h1>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Logs tabs"
        className="grid grid-cols-3 rounded-lg overflow-hidden border mb-6"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={activeTab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActiveTab(t.id)}
            className={`py-3 text-center font-medium ${
              activeTab === t.id
                ? "bg-amber-100 text-black"
                : "bg-gray-100 text-gray-500 hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <section
        id="panel-trust"
        role="tabpanel"
        aria-labelledby="tab-trust"
        hidden={activeTab !== "trust"}
        className="p-4 border rounded bg-white"
      >
        <p className="text-gray-700 mb-3">Trust logs:</p>
        <TrustLogsComp />
      </section>

      <section
        id="panel-ip"
        role="tabpanel"
        aria-labelledby="tab-ip"
        hidden={activeTab !== "ip"}
        className="p-4 border rounded bg-white"
      >
        <p className="text-gray-700 mb-3">Recent IP logs:</p>
        <IpLogsComp />
      </section>

      <section
        id="panel-current"
        role="tabpanel"
        aria-labelledby="tab-current"
        hidden={activeTab !== "current"}
        className="p-4 border rounded bg-white"
      >
        <p className="text-gray-700 mb-3">Current connected IPs:</p>
        <CurrentConnectIP />
      </section>
    </div>
  );
}
