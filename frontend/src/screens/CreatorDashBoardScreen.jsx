// src/screens/CreatorDashBoardScreen.jsx
import { useEffect, useState } from "@lynx-js/react";
import { API_BASE } from "../App";

export function CreatorDashBoardScreen() {
  const [creatorData, setCreatorData] = useState({
    id: "creator_001",
    username: "techjam",
    displayName: "Tech Jam",
    tier: "Gold",
    followers: 125400,
    verified: true,
    joinDate: "2024-03-15",
  });

  const [earnings, setEarnings] = useState({
    total: 2840.75,
    thisMonth: 890.5,
    lastMonth: 1240.25,
    pendingPayouts: 320.0,
    sources: {
      creatorFund: 1200.3,
      liveGifts: 890.45,
      brandDeals: 750.0,
    },
  });

  const [metrics, setMetrics] = useState({
    totalViews: 8500000,
    totalLikes: 425000,
    totalShares: 85000,
    totalComments: 45000,
    avgEngagementRate: 8.2,
    monthlyGrowth: 15.7,
    topVideo: {
      id: "video_123",
      title: "How AI Will Change Everything in 2025",
      views: 1200000,
      likes: 89000,
    },
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: "earning",
      message: "Creator Fund payout: $45.20",
      time: "2 hours ago",
      amount: 45.2,
    },
    {
      id: 2,
      type: "milestone",
      message: "Reached 125K followers!",
      time: "1 day ago",
    },
    {
      id: 3,
      type: "video",
      message: "New video gained 10K views",
      time: "2 days ago",
    },
    {
      id: 4,
      type: "achievement",
      message: "Unlocked 'Viral Content' badge",
      time: "3 days ago",
    },
    {
      id: 5,
      type: "earning",
      message: "Live gift received: $12.50",
      time: "4 days ago",
      amount: 12.5,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-clear error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  const getTierColor = (tier) => {
    const colors = {
      Bronze: "#CD7F32",
      Silver: "#C0C0C0",
      Gold: "#FFD700",
      Diamond: "#B9F2FF",
    };
    return colors[tier] || "#9CA3AF";
  };

  const getTierProgress = (tier) => {
    const progress = {
      Bronze: 25,
      Silver: 50,
      Gold: 75,
      Diamond: 100,
    };
    return progress[tier] || 0;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return "$" + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
  };

  if (loading) {
    return (
      <view className="logs-container">
        <view className="creator-loading">
          <text className="creator-loading-text">
            Loading your creator dashboard...
          </text>
          <view className="creator-loading-spinner"></view>
        </view>
      </view>
    );
  }

  return (
    <view className="logs-container">
      <scroll-view
        className="creator-scroll-container"
        scroll-y="true"
        style="height: calc(100vh - 120px);"
      >
        {/* Header Section */}
        <view className="creator-header">
          <view className="creator-profile-redesign">
            {/* First Row: Username, Verified Badge, Tier Level */}
            <view className="creator-first-row">
              <text className="creator-display-name-large">
                {creatorData.displayName}
              </text>
              {creatorData.verified && (
                <text className="creator-verified">✓</text>
              )}
              <view className="creator-tier-badge-enhanced" style={`background: linear-gradient(135deg, ${getTierColor(creatorData.tier)}20, ${getTierColor(creatorData.tier)}40); border-color: ${getTierColor(creatorData.tier)}; box-shadow: 0 0 20px ${getTierColor(creatorData.tier)}40;`}>
                <text className="creator-tier-icon">👑</text>
                <text className="creator-tier-name-enhanced" style={`color: ${getTierColor(creatorData.tier)};`}>
                  {creatorData.tier}
                </text>
              </view>
            </view>

            {/* Second Row: @user and exp (aligned) */}
            <view className="creator-second-row">
              <text className="creator-username-large">
                @{creatorData.username}
              </text>
              <view className="creator-spacer"></view>
              <text className="creator-exp-text">{getTierProgress(creatorData.tier)} exp</text>
            </view>

            {/* Third Row: Progress Bar */}
            <view className="creator-third-row">
              <view className="creator-tier-progress">
                <view className="creator-progress-bar">
                  <view
                    className="creator-progress-fill"
                    style={`width: ${getTierProgress(creatorData.tier)}%; background: linear-gradient(90deg, ${getTierColor(creatorData.tier)}, ${getTierColor(creatorData.tier)}80);`}
                  ></view>
                </view>
                <text className="creator-progress-text">
                  Level {getTierProgress(creatorData.tier)}/100
                </text>
              </view>
            </view>
          </view>
        </view>

        {/* Earnings Overview */}
        <view className="creator-section">
          <text className="creator-section-title">💰 Earnings Overview</text>

          <view className="creator-earnings-grid">
            <view className="creator-earning-card creator-earning-primary">
              <text className="creator-earning-label">Total Earnings</text>
              <text className="creator-earning-amount">
                {formatCurrency(earnings.total)}
              </text>
              <text className="creator-earning-subtitle">All time</text>
            </view>

            <view className="creator-earning-card">
              <text className="creator-earning-label">This Month</text>
              <text className="creator-earning-amount creator-earning-success">
                {formatCurrency(earnings.thisMonth)}
              </text>
              <text className="creator-earning-subtitle">
                +
                {((earnings.thisMonth / earnings.lastMonth - 1) * 100).toFixed(
                  1
                )}
                % from last month
              </text>
            </view>

            <view className="creator-earning-card">
              <text className="creator-earning-label">Pending Payouts</text>
              <text className="creator-earning-amount creator-earning-warning">
                {formatCurrency(earnings.pendingPayouts)}
              </text>
              <text className="creator-earning-subtitle">
                Next payout in 5 days
              </text>
            </view>
          </view>

          <view className="creator-earnings-breakdown">
            <text className="creator-breakdown-title">Revenue Sources</text>
            <view className="creator-breakdown-grid">
              <view className="creator-breakdown-item">
                <view className="creator-breakdown-icon creator-icon-fund">
                  📺
                </view>
                <view className="creator-breakdown-info">
                  <text className="creator-breakdown-name">Creator Fund</text>
                  <text className="creator-breakdown-amount">
                    {formatCurrency(earnings.sources.creatorFund)}
                  </text>
                </view>
              </view>
              <view className="creator-breakdown-item">
                <view className="creator-breakdown-icon creator-icon-gifts">
                  🎁
                </view>
                <view className="creator-breakdown-info">
                  <text className="creator-breakdown-name">Live Gifts</text>
                  <text className="creator-breakdown-amount">
                    {formatCurrency(earnings.sources.liveGifts)}
                  </text>
                </view>
              </view>
              <view className="creator-breakdown-item">
                <view className="creator-breakdown-icon creator-icon-brands">
                  🤝
                </view>
                <view className="creator-breakdown-info">
                  <text className="creator-breakdown-name">Brand Deals</text>
                  <text className="creator-breakdown-amount">
                    {formatCurrency(earnings.sources.brandDeals)}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>

        {/* Performance Metrics */}
        <view className="creator-section">
          <text className="creator-section-title">📊 Performance Metrics</text>

          <view className="creator-metrics-grid">
            <view className="creator-metric-card">
              <text className="creator-metric-icon">👁️</text>
              <text className="creator-metric-value">
                {formatNumber(metrics.totalViews)}
              </text>
              <text className="creator-metric-label">Total Views</text>
            </view>

            <view className="creator-metric-card">
              <text className="creator-metric-icon">❤️</text>
              <text className="creator-metric-value">
                {formatNumber(metrics.totalLikes)}
              </text>
              <text className="creator-metric-label">Total Likes</text>
            </view>

            <view className="creator-metric-card">
              <text className="creator-metric-icon">🔄</text>
              <text className="creator-metric-value">
                {formatNumber(metrics.totalShares)}
              </text>
              <text className="creator-metric-label">Total Shares</text>
            </view>

            <view className="creator-metric-card">
              <text className="creator-metric-icon">💬</text>
              <text className="creator-metric-value">
                {formatNumber(metrics.totalComments)}
              </text>
              <text className="creator-metric-label">Total Comments</text>
            </view>

            <view className="creator-metric-card creator-metric-highlight">
              <text className="creator-metric-icon">📈</text>
              <text className="creator-metric-value">
                {metrics.avgEngagementRate}%
              </text>
              <text className="creator-metric-label">Avg Engagement Rate</text>
            </view>

            <view className="creator-metric-card creator-metric-growth">
              <text className="creator-metric-icon">🚀</text>
              <text className="creator-metric-value">
                +{metrics.monthlyGrowth}%
              </text>
              <text className="creator-metric-label">Monthly Growth</text>
            </view>
          </view>

          {/* Top Performing Video */}
          <view className="creator-top-video">
            <text className="creator-top-video-title">
              🔥 Top Performing Video
            </text>
            <view className="creator-top-video-card">
              <view className="creator-video-thumbnail">📹</view>
              <view className="creator-video-info">
                <text className="creator-video-title">
                  {metrics.topVideo.title}
                </text>
                <view className="creator-video-stats">
                  <text className="creator-video-stat">
                    {formatNumber(metrics.topVideo.views)} views
                  </text>
                  <text className="creator-video-stat">
                    {formatNumber(metrics.topVideo.likes)} likes
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>

        {/* Recent Activity */}
        <view className="creator-section">
          <text className="creator-section-title">🕐 Recent Activity</text>

          <view className="creator-activity-feed">
            {recentActivity.map((activity) => (
              <view key={activity.id} className="creator-activity-item">
                <view
                  className={`creator-activity-icon creator-activity-${activity.type}`}
                >
                  {activity.type === "earning" && "💰"}
                  {activity.type === "milestone" && "🎯"}
                  {activity.type === "video" && "📹"}
                  {activity.type === "achievement" && "🏆"}
                </view>
                <view className="creator-activity-content">
                  <text className="creator-activity-message">
                    {activity.message}
                  </text>
                  <text className="creator-activity-time">{activity.time}</text>
                </view>
                {activity.amount && (
                  <text className="creator-activity-amount">
                    +{formatCurrency(activity.amount)}
                  </text>
                )}
              </view>
            ))}
          </view>
        </view>

        {/* Error Banner */}
        {error && (
          <view className="logs-error">
            <view className="logs-banner-content">
              <text className="logs-banner-text">{error}</text>
              <text
                className="logs-banner-close"
                bindtap={() => setError(null)}
              >
                ✕
              </text>
            </view>
          </view>
        )}
      </scroll-view>
    </view>
  );
}
