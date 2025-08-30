import { useState } from "@lynx-js/react";

import IpLogsComp from "../components/ipLogsComp";
import TrustLogsComp from "../components/trustLogsComp";
import ConnectedIpsComp from "../components/ConnectedIpsComp";

export function LogsScreen() {
    const [activeTab, setActiveTab] = useState("trust"); // "trust" | "ip"

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
                <text
                    bindtap={() => setActiveTab("connected")}
                    className={`logs-tab ${activeTab === "connected" ? "logs-tab-active" : ""}`}
                >
                    Connected IPs
                </text>
                
            </view>

            {/* Tab Content */}
            <view className="logs-content">
                {activeTab === "trust" && (
                    <view className="logs-panel">
                        <TrustLogsComp />
                    </view>
                )}
                {activeTab === "ip" && (
                    <view className="logs-panel">
                        <IpLogsComp />
                    </view>
                )}
                {activeTab === "connected" && (
                    <view className="logs-panel">
                        <ConnectedIpsComp />
                    </view>
                )}
            </view>
        </view>
    );
}
