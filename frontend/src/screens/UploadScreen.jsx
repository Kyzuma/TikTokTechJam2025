import { useState } from "react";
import { API_BASE } from "../App";

export function UploadScreen() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeVideo = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/analyze-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: videoUrl
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showSampleOutput = () => {
    setError(null);
    setResult({
      message: "Quality score is low",
      score: 23.6,
      summary: "The high hate speech/mental health score (0.95) is due to the profuse use of profane and abusive language (\"fucking,\" \"bitch,\" \"bastard\"). The low clickbait score (0.0) indicates the transcript lacks sensationalism or attention-grabbing tactics. The low quality score suggests poor language and overall content. The high hate speech/mental health score (0.95) is due to the profuse use of profane and abusive language (\"fucking,\" \"bitch,\" \"bastard\"). The low clickbait score (0.0) indicates the transcript lacks sensationalism or attention-grabbing tactics. The low quality score suggests poor language and overall content. The high hate speech/mental health score (0.95) is due to the profuse use of profane and abusive language (\"fucking,\" \"bitch,\" \"bastard\"). The low clickbait score (0.0) indicates the transcript lacks sensationalism or attention-grabbing tactics. The low quality score suggests poor language and overall content."
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
      >      {/* Loading Overlay */}
      {loading && (
        <view className="loading-overlay">
          <view className="loading-content">
            <view className="loading-spinner">
              <text className="loading-icon">🔍</text>
            </view>
            <text className="loading-title">Analyzing Video Content</text>
            <text className="loading-subtitle">Processing audio and visual elements...</text>
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
      {error && <view className="analysis-error-widget">
        <view className="analysis-error-content">
          <text className="analysis-error-text">❌ {error}</text>
        </view>
      </view>}

      {/* Analysis Form */}
      <view className="ao-stack">
        {/* Video URL input */}
        <view className="ao-widget upload-field-widget">
          <view className="ao-left">
            <view>
              <text className="ao-title">Video URL</text>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="upload-input"
              />
              <text className="ao-sub">Enter a direct link to the video file</text>
            </view>
          </view>
        </view>

        {/* Analyze button */}
        <view 
          className={`ao-widget upload-action-widget ${loading ? 'analysis-loading' : ''}`} 
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
                {loading ? "Processing content quality" : "Check video quality and content"}
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
                  <text className="score-label" style={{ color: getScoreColor(result.score) }}>
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

