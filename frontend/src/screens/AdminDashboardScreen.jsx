export function AdminDashboardScreen({ setActiveTab }) {
  const userId = "admin-001";

  const handleWidgetClick = (tabName) => {
    if (setActiveTab) {
      setActiveTab(tabName);
    }
  };

  return (
    <view className="ao-container">
      <view>
        <text className="ao-label">User ID</text>
        <view className="ao-user">
          <view className="ao-user-badge">
            <text>👤 {userId}</text>
          </view>
        </view>
      </view>

      <view className="ao-stack">
        {/* Transactions Widget */}
        <view
          className="ao-widget"
          bindtap={() => handleWidgetClick("Transactions")}
        >
          <view className="ao-left">
            <view className="ao-icon">
              <text>💳</text>
            </view>
            <view>
              <text className="ao-title">Transactions</text>
              <text className="ao-sub">View transactions and status</text>
            </view>
          </view>
          <view className="ao-chevron">
            <text>→</text>
          </view>
        </view>

        {/* Logs History Widget */}
        <view className="ao-widget" bindtap={() => handleWidgetClick("Logs")}>
          <view className="ao-left">
            <view className="ao-icon">
              <text>📜</text>
            </view>
            <view>
              <text className="ao-title">Logs History</text>
              <text className="ao-sub">Browse logs: trust logs, ip logs</text>
            </view>
          </view>
          <view className="ao-chevron">
            <text>→</text>
          </view>
        </view>

        {/* Manage Users Widget */}
        <view className="ao-widget" bindtap={() => handleWidgetClick("Users")}>
          <view className="ao-left">
            <view className="ao-icon">
              <text>👤</text>
            </view>
            <view>
              <text className="ao-title">Manage Users</text>
              <text className="ao-sub">Browse logs: user profiles</text>
            </view>
          </view>
          <view className="ao-chevron">
            <text>→</text>
          </view>
        </view>
      </view>
    </view>
  );
}
