import { useState } from "react";

export default function FileUpload() {
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = () => {
    if (!video) {
      alert("Please select a video first!");
      return;
    }
    console.log("Uploading:", { title, video, caption });

    // Simulate success
    setSuccess("✅ Video uploaded successfully!");
    setTimeout(() => setSuccess(null), 4000); // auto hide after 4s
  };

  return (
    <div className="upload-container">
      <style>{`
        .upload-container {
          min-height: 100vh;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        }
        .upload-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 24px;
          color: #1f2937;
        }
        .upload-field {
          margin-bottom: 16px;
        }
        .upload-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 4px;
          color: #374151;
        }
        .upload-input {
          display: block;
          width: 100%;
          padding: 8px 12px;
          font-size: 0.9rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }
        .upload-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }
        .upload-hint {
          margin-top: 6px;
          font-size: 0.8rem;
          color: #6b7280;
        }
        .upload-btn {
          width: 100%;
          padding: 10px 16px;
          font-size: 1rem;
          font-weight: 600;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .upload-btn:hover {
          background-color: #1e40af;
        }
        .success-banner {
          margin-bottom: 16px;
          padding: 12px;
          background-color: #d1fae5; /* green-100 */
          color: #065f46; /* green-800 */
          border: 1px solid #a7f3d0; /* green-200 */
          border-radius: 6px;
          font-size: 0.9rem;
        }
      `}</style>

      {/* Page Title */}
      <h1 className="upload-title">Video Upload</h1>

      {/* Success banner */}
      {success && <div className="success-banner">{success}</div>}

      {/* Title field */}
      <div className="upload-field">
        <label className="upload-label">Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter video title..."
          className="upload-input"
        />
      </div>

      {/* Video input */}
      <div className="upload-field">
        <label className="upload-label">Video:</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideo(e.target.files?.[0] || null)}
          className="upload-input"
        />
        {video && <p className="upload-hint">Selected: {video.name}</p>}
      </div>

      {/* Caption input */}
      <div className="upload-field">
        <label className="upload-label">Caption:</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Enter a caption..."
          className="upload-input"
        />
      </div>

      {/* Upload button */}
      <button onClick={handleUpload} className="upload-btn">
        Upload
      </button>
    </div>
  );
}
