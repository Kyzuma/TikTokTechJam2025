# ValueTok 🎵

A content moderation and anti-fraud platform for social media platforms.

## 🚀 Quick Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git
- FFmpeg (for video processing)

### Installation

1. **Install FFmpeg**
   ```bash
   # macOS (using Homebrew)
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # Windows (using Chocolatey)
   choco install ffmpeg
   ```

2. **Clone and setup backend**
   ```bash
   git clone https://github.com/your-username/ValueTok.git
   cd ValueTok/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   brew
   ```

2. **Setup frontend**
   ```bash
   cd ../frontend
   npm install
   ```

3. **Configure environment**
   
   Create `backend/.env`:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Configure API_BASE**
   
   Update `frontend/src/App.jsx`:
   ```javascript
   export const API_BASE = "http://YOUR_LOCAL_IP:8080"; // Change to your machine's IP
   ```
   
   Find your IP: `ifconfig` (macOS/Linux) or `ipconfig` (Windows)

5. **Download GeoLite2 database**
   - Download from MaxMind (free account required)
   - Place `GeoLite2-City.mmdb` in `backend/` directory

## 🏃‍♂️ Run Locally

1. **Start backend services**
   ```bash
   # Terminal 1 - Main API
   cd backend
   python app.py
   
   # Terminal 2 - Content evaluation
   cd backend/content_evaluation
   python app.py
   ```

2. **Start mobile app**
   ```bash
   # Terminal 3
   cd frontend
   npm run dev
   ```
   Scan QR code with your phone to test

## 📁 Project Structure
```
ValueTok/
├── app.py                          # Main Flask API
├── backend/
│   ├── requirements.txt
│   ├── anti_fraud_service.py
│   ├── content_evaluation/        # Content moderation
│   └── GeoLite2-City.mmdb
└── frontend/                      # Lynx.js mobile app
    └── src/
        ├── components/
        └── screens/
```

## 🔧 API Endpoints

- `GET /` - API status
- `POST /checkContent` - Analyze video content
- `POST /ipcheck` - Check IP for fraud
- `POST /transaction` - Analyze transactions

---

*ValueTok - Protecting digital communities through intelligent content moderation*
