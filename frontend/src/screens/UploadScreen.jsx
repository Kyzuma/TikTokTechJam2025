import { useState, useEffect } from "react";

export function UploadScreen() {
  const API_BASE = "http://192.168.88.13:8081";
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Auto-clear error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const analyzeVideo = async () => {

    console.log("Analyzing video:", videoUrl);

    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Making request to:", `${API_BASE}/checkContent`);
      console.log("Request payload:", { url: videoUrl });
      
      const response = await fetch(`${API_BASE}/checkContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Response data:", data);
      setResult(data);
    } catch (err) {
      console.error("Full error details:", err);
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
      let errorMessage = `Analysis failed: ${err.message}`;
      
      // More specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = `Network error: Cannot connect to server at ${API_BASE}. Is the server running?`;
      } else if (err.message.includes('CORS')) {
        errorMessage = `CORS error: Server needs to allow requests from this domain`;
      } else if (err.message.includes('400')) {
        errorMessage = `Bad request: Invalid video URL or request format`;
      } else if (err.message.includes('500')) {
        errorMessage = `Server error: Something went wrong on the server side`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showSampleOutput = () => {
    setError(null);
    setResult({
      message: "Quality score is low",
      score: 23.6,
      summary:
        'The high hate speech/mental health score (0.95) is due to the profuse use of profane and abusive language ("fucking," "bitch," "bastard"). The low clickbait score (0.0) indicates the transcript lacks sensationalism or attention-grabbing tactics. The low quality score suggests poor language and overall content. The high hate speech/mental health score (0.95) is due to the profuse use of profane and abusive language ("fucking," "bitch," "bastard"). The low clickbait score (0.0) indicates the transcript lacks sensationalism or attention-grabbing tactics. The low quality score suggests poor language and overall content. The high hate speech/mental health score (0.95) is due to the profuse use of profane and abusive language ("fucking," "bitch," "bastard"). The low clickbait score (0.0) indicates the transcript lacks sensationalism or attention-grabbing tactics. The low quality score suggests poor language and overall content.',
    });
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#10b981"; // green
    if (score >= 40) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return "High Quality";
    if (score >= 40) return "Medium Quality";
    return "Low Quality";
  };

  return (
    <scroll-view
      className="creator-scroll-container"
      scroll-y="true"
      style="height: calc(100vh - 120px);"
    >
      {" "}
      {/* Loading Overlay */}
      {loading && (
        <view className="loading-overlay">
          <view className="loading-content">
            <view className="loading-spinner">
              <text className="loading-icon">🔍</text>
            </view>
            <text className="loading-title">Analyzing Video Content</text>
            <text className="loading-subtitle">
              Processing audio and visual elements...
            </text>
            <view className="loading-progress">
              <view className="loading-progress-bar"></view>
            </view>
            <text className="loading-hint">This may take 10-30 seconds</text>
          </view>
        </view>
      )}
      {/* Page Title */}
      <view>
        <text className="ao-label">VIDEO CONTENT ANALYZER</text>
      </view>
      {/* Error banner */}
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
      {/* Analysis Form */}
      <view className="ao-stack">
        {/* Video URL input */}
        <view className="ao-widget upload-field-widget">
          <view className="ao-left">
            <view>
              <text className="ao-title">Video URL</text>
              <view className="input-container">
                <input
                  type="text"
                  value={videoUrl}
                  bindinput={(e) => {
                    console.log("Input changed:", e.detail.value);
                    setVideoUrl(e.detail.value);
                  }}
                  placeholder="https://example.com/video.mp4"
                  className="upload-input"
                />
              </view>
              <text className="ao-sub">
                Enter a direct link to the video file
              </text>
            </view>
          </view>
        </view>

        {/* Analyze button */}
        <view
          className={`ao-widget upload-action-widget ${
            loading ? "analysis-loading" : ""
          }`}
          bindtap={analyzeVideo}
        >
          <view className="ao-left">
            <view className="ao-icon">
              <text>{loading ? "⏳" : "🔍"}</text>
            </view>
            <view>
              <text className="ao-title">
                {loading ? "Analyzing Video..." : "Analyze Content"}
              </text>
              <text className="ao-sub">
                {loading
                  ? "Processing content quality"
                  : "Check video quality and content"}
              </text>
            </view>
          </view>
          <view className="ao-chevron">
            <text>→</text>
          </view>
        </view>

        {/* Results */}
        {result && (
          <view className="analysis-results-container">
            {/* Score Display */}
            <view className="score-card">
              <view className="score-card-header">
                <text className="score-card-title">Quality Assessment</text>
              </view>
              <view className="score-display">
                <view
                  className="score-circle"
                  style={{ backgroundColor: getScoreColor(result.score) }}
                >
                  <text className="score-number">{result.score}</text>
                </view>
                <view className="score-info">
                  <text
                    className="score-label"
                    style={{ color: getScoreColor(result.score) }}
                  >
                    {getScoreLabel(result.score)}
                  </text>
                  <text className="score-message">{result.message}</text>
                </view>
              </view>
            </view>

            {/* Summary */}
            <view className="summary-card">
              <view className="summary-header">
                <text className="summary-title">📊 Detailed Analysis</text>
              </view>
              <view className="summary-content">
                <text className="summary-text">{result.summary}</text>
              </view>
            </view>
          </view>
        )}
      </view>
    </scroll-view>
  );
}
