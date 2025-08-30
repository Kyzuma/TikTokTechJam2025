from flask import Flask, request, jsonify
from flask_cors import CORS
from invokes import invoke_http

app = Flask(__name__)


@app.route('/')
def home():
    return jsonify({"message": "API is running!", "status": "success"})

@app.route('/api/test')
def test():
    # Test your wrapper function
    result = invoke_http("https://httpbin.org/get", method="GET")
    return jsonify(result)

@app.route('/api/proxy', methods=['POST'])
def proxy():
    """
    Proxy endpoint to test your invoke_http wrapper
    Send POST request with: {"url": "target_url", "method": "GET/POST/etc", "data": {...}}
    """
    try:
        data = request.get_json()
        url = data.get('url')
        method = data.get('method', 'GET')
        json_data = data.get('data')
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
            
        result = invoke_http(url, method=method, json=json_data)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask API server...")
    print("📍 API will be available at: http://localhost:5000")
    print("🧪 Test endpoint: http://localhost:5000/api/test")
    app.run(debug=True, host='0.0.0.0', port=5000)