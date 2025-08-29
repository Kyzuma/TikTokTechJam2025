import ipaddress
import geoip2.database
from flask import Blueprint, Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from flasgger import Swagger
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Any, Deque, Dict, Iterable, List, Optional, Tuple
import json

# ------------------------------
# Setup
# ------------------------------

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)
app = Flask(__name__)
Swagger(app)
CORS(app)
geo_reader = geoip2.database.Reader("backend\GeoLite2-City.mmdb")

ip_checker_blueprint = Blueprint("ip_checker", __name__)
user_profile_blueprint = Blueprint("user", __name__)
trust_log_blueprint = Blueprint("trust_log", __name__)
ip_log_blueprint = Blueprint("ip_log", __name__)
transaction_blueprint = Blueprint("transaction", __name__)
flagged_transaction_blueprint = Blueprint("flagged_transaction", __name__)
current_ip_blueprint = Blueprint("current_ip", __name__)

# ------------------------------
# IP Monitoring Functions
# ------------------------------

@ip_checker_blueprint.route("/logIP", methods=["GET"])
def log_ip():
    """
    ---
    get:
      summary: Log user IP and check for suspicious activity
      tags:
        - IP Logging (User)
      description: |
        Logs the user's IP address, checks recent logs for geolocation anomalies
        or shared IP usage, and flags suspicious activity for review.
      parameters:
        - in: query
          name: user_id
          schema:
            type: integer
          required: true
          description: The ID of the user logging in.
      responses:
        200:
          description: IP logged successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    # Get client IP
    ip_address = request.remote_addr
    ip_address = "30.6.250.1"
    # GeoIP lookup
    try:
        response = geo_reader.city(ip_address)
        country = response.country.name
        region = response.subdivisions.most_specific.name
        city = response.city.name
        latitude = response.location.latitude
        longitude = response.location.longitude
    except Exception:
        country = region = city = None
        latitude = longitude = None

    # Initialize flag
    is_suspicious = False
    remarks = "Normal login"
    now = datetime.utcnow()

    # 1️⃣ Check recent logs from same IP
    # Check if this IP exists in current_connected_ip
    current_ip_record = supabase.table("current_connected_ip") \
    .select("*") \
    .eq("ip_address", ip_address) \
    .execute().data

    user_id_int = int(user_id)  # convert to int

    if current_ip_record:
        record = current_ip_record[0]
        existing_users = record["user_ids"]  # already a list of integers
        if user_id_int not in existing_users:
            existing_users.append(user_id_int)

        supabase.table("current_connected_ip").update({
            "user_ids": existing_users,  # pass list of ints
            "is_suspicious": True if len(existing_users) > 5 else False,
        }).eq("id", record["id"]).execute()

        if len(existing_users) > 5:
            is_suspicious = True
            remarks = "Multiple users from same IP"

    else:
        # New record
        supabase.table("current_connected_ip").insert({
            "ip_address": ip_address,
            "user_ids": [user_id_int],  # list of integers
            "is_suspicious": False,
        }).execute()


    # 2️⃣ Check recent logs from same user
    recent_user_logs = supabase.table("ip_logs") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("checked_at", (now - timedelta(minutes=30)).isoformat()) \
        .execute().data

    for log in recent_user_logs:
      if log["ip_address"] != ip_address and log["country"] != country:
          is_suspicious = True
          remarks = "User login from different IP and country within 30 mins"
          break  # stop after first anomaly detected

    # Write log to Supabase
    supabase.table("ip_logs").insert({
        "user_id": user_id,
        "ip_address": ip_address,
        "is_suspicious": is_suspicious,
        "country": country,
        "region": region,
        "city": city,
        "latitude": latitude,
        "longitude": longitude,
        "checked_at": now.isoformat(),
        "remarks": remarks
    }).execute()

    return jsonify({"message": "IP logged successfully", "is_suspicious": is_suspicious, "remarks": remarks})

# ------------------------------
# CRUD APIs
# ------------------------------

@user_profile_blueprint.route("/user_profiles", methods=["GET"])
def get_user_profiles():
    """
    ---
    get:
      summary: Get all user profiles
      description: Retrieve all user profiles including user_id, created_at, verification status, last IP, trust score, and transaction limit.
      tags:
        - CRUD APIs
      responses:
        200:
          description: A list of user profiles
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    user_id:
                      type: integer
                    created_at:
                      type: string
                      format: date-time
                    is_verified:
                      type: boolean
                    last_ip:
                      type: string
                    trust_score:
                      type: integer
                    transaction_limit:
                      type: integer
    """
    # Fetch all user profiles from Supabase
    result = supabase.table("user_profile").select("*").execute()
    data = result.data if result.data else []

    return jsonify(data)

@trust_log_blueprint.route("/trust_logs", methods=["GET"])
def get_trust_logs():
    """
    ---
    get:
      summary: Get all trust log entries
      description: Retrieve all trust logs including id, user_id, added_trust, remarks, and created_at.
      tags:
        - CRUD APIs
      responses:
        200:
          description: A list of trust log entries
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: integer
                    user_id:
                      type: integer
                    added_trust:
                      type: integer
                    remarks:
                      type: string
                    created_at:
                      type: string
                      format: date-time
    """
    # Fetch all trust logs from Supabase
    result = supabase.table("trust_log").select("*").execute()
    data = result.data if result.data else []

    return jsonify(data)

@ip_log_blueprint.route("/ip_logs", methods=["GET"])
def get_ip_logs():
    """
    ---
    get:
      summary: Get IP logs
      description: Retrieve all IP logs including id, user_id, ip_address, is_suspicious, country, region, city, latitude, longitude, checked_at, and remarks.
      tags:
        - CRUD APIs
      parameters:
        - in: query
          name: suspicious
          schema:
            type: boolean
          required: false
          description: Filter only suspicious logs if true
      responses:
        200:
          description: A list of IP log entries
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: integer
                    user_id:
                      type: integer
                    ip_address:
                      type: string
                    is_suspicious:
                      type: boolean
                    country:
                      type: string
                    region:
                      type: string
                    city:
                      type: string
                    latitude:
                      type: number
                    longitude:
                      type: number
                    checked_at:
                      type: string
                      format: date-time
                    remarks:
                      type: string
    """
    # Optional query parameter to filter suspicious logs
    suspicious_filter = request.args.get("suspicious")
    
    query = supabase.table("ip_logs").select("*")
    
    if suspicious_filter is not None:
        # Convert query param to boolean
        is_suspicious = suspicious_filter.lower() == "true"
        query = query.eq("is_suspicious", is_suspicious)
    
    result = query.execute()
    data = result.data if result.data else []
    
    return jsonify(data)

@ip_log_blueprint.route("/ip_logs/<int:log_id>/mark_safe", methods=["PUT"])
def mark_ip_safe(log_id):
    """
    ---
    put:
      summary: Mark IP log as not suspicious
      description: Update an IP log entry after moderator review to set is_suspicious = false.
      tags:
        - CRUD APIs
      parameters:
        - in: path
          name: log_id
          schema:
            type: integer
          required: true
          description: ID of the IP log entry to update
      responses:
        200:
          description: IP log updated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  updated_id:
                    type: integer
    """
    # Update the record in Supabase
    result = supabase.table("ip_logs").update({
        "is_suspicious": False,
        "remarks": "Marked safe after review"
    }).eq("id", log_id).execute()
    
    if result.data:
        return jsonify({
            "message": "IP log updated successfully",
            "updated_id": log_id
        })
    else:
        return jsonify({
            "message": "IP log not found",
            "updated_id": log_id
        }), 404

@transaction_blueprint.route("/transactions", methods=["GET"])
def get_transactions():
    """
    ---
    get:
      summary: Get all transactions
      description: Retrieve all transactions including transaction_id, from_user_id, to_user_id, amount, status, and created_at.
      tags:
        - CRUD APIs
      responses:
        200:
          description: A list of transaction records
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    transaction_id:
                      type: integer
                    from_user_id:
                      type: integer
                    to_user_id:
                      type: integer
                    amount:
                      type: number
                    status:
                      type: string
                    created_at:
                      type: string
                      format: date-time
    """
    # Fetch all transactions from Supabase
    result = supabase.table("transactions").select("*").execute()
    data = result.data if result.data else []

    return jsonify(data)

@flagged_transaction_blueprint.route("/flagged_transactions", methods=["GET"])
def get_flagged_transactions():
    """
    ---
    get:
      summary: Get flagged transactions
      description: Retrieve all flagged transactions including flagged_transaction_id, created_at, transaction_ids, is_resolved, and reason.
      tags:
        - CRUD APIs
      parameters:
        - in: query
          name: resolved
          schema:
            type: boolean
          required: false
          description: Filter by resolved status (true or false)
      responses:
        200:
          description: A list of flagged transactions
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    flagged_transaction_id:
                      type: integer
                    created_at:
                      type: string
                      format: date-time
                    transaction_ids:
                      type: array
                      items:
                        type: integer
                    is_resolved:
                      type: boolean
                    reason:
                      type: string
    """
    # Optional query parameter to filter resolved status
    resolved_filter = request.args.get("resolved")
    
    query = supabase.table("flagged_transaction").select("*")
    
    if resolved_filter is not None:
        # Convert query param to boolean
        is_resolved = resolved_filter.lower() == "true"
        query = query.eq("is_resolved", is_resolved)
    
    result = query.execute()
    data = result.data if result.data else []

    # Convert transaction_ids from Postgres int8[] to Python list of integers (should already be list)
    for record in data:
        if record.get("transaction_ids") is None:
            record["transaction_ids"] = []
        else:
            # Ensure all integers
            record["transaction_ids"] = [int(tid) for tid in record["transaction_ids"]]

    return jsonify(data)



@current_ip_blueprint.route("/current_connected_ips", methods=["GET"])
def get_current_connected_ips():
    """
    ---
    get:
      summary: Get current connected IPs
      description: Retrieve all current connected IP records including id, ip_address, user_ids, and is_suspicious.
      tags:
        - CRUD APIs
      responses:
        200:
          description: A list of current connected IP records
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: integer
                    ip_address:
                      type: string
                    user_ids:
                      type: array
                      items:
                        type: integer
                    is_suspicious:
                      type: boolean
    """
    # Fetch all records from Supabase
    result = supabase.table("current_connected_ip").select("*").execute()
    data = result.data if result.data else []

    # Ensure user_ids are integers
    for record in data:
        if record.get("user_ids") is None:
            record["user_ids"] = []
        else:
            record["user_ids"] = [int(uid) for uid in record["user_ids"]]

    return jsonify(data)
# # ------------------------------
# # Rules Engine
# # ------------------------------

# class VelocityRuleConfig:
#     def __init__(self,
#                  max_gifts_per_minute: int = 100,
#                  max_logins_per_ip_5min: int = 20):
#         self.max_gifts_per_minute = max_gifts_per_minute
#         self.max_logins_per_ip_5min = max_logins_per_ip_5min


# def detect_velocity_flags(events: Iterable[Dict[str, Any]], config: Optional[VelocityRuleConfig] = None) -> List[Dict[str, Any]]:
#     """
#     Events: iterable of dicts with keys: timestamp (iso or datetime), type ('GIFT'|'LOGIN'...), user_id, ip
#     Returns: list of moderation_flags row dicts
#     """
#     cfg = config or VelocityRuleConfig()

#     # per-user gifts in sliding 60s window
#     user_gift_windows: Dict[str, Deque[datetime]] = defaultdict(deque)
#     # per-IP logins in sliding 5m window
#     ip_login_windows: Dict[str, Deque[datetime]] = defaultdict(deque)

#     flags: List[Dict[str, Any]] = []

#     def parse_ts(ts: Any) -> datetime:
#         if isinstance(ts, datetime):
#             return ts
#         return datetime.fromisoformat(str(ts))

#     for ev in events:
#         ts = parse_ts(ev.get('timestamp'))
#         ev_type = ev.get('type')
#         user_id = ev.get('user_id')
#         ip = ev.get('ip')

#         if ev_type == 'GIFT':
#             dq = user_gift_windows[user_id]
#             dq.append(ts)
#             # trim >60s
#             cutoff = ts - timedelta(seconds=60)
#             while dq and dq[0] < cutoff:
#                 dq.popleft()
#             if len(dq) >= cfg.max_gifts_per_minute:
#                 flags.append({
#                     'user_id': user_id,
#                     'flag_type': 'VELOCITY',
#                     'details': {'reason': 'GIFT_PER_MINUTE', 'count': len(dq)},
#                 })

#         if ev_type == 'LOGIN' and ip:
#             dq = ip_login_windows[ip]
#             dq.append(ts)
#             cutoff = ts - timedelta(minutes=5)
#             while dq and dq[0] < cutoff:
#                 dq.popleft()
#             if len(dq) >= cfg.max_logins_per_ip_5min:
#                 flags.append({
#                     'flag_type': 'VELOCITY',
#                     'details': {'reason': 'LOGINS_PER_IP_5MIN', 'ip': ip, 'count': len(dq)},
#                 })

#     return flags


# def detect_circular_flows(transactions: Iterable[Dict[str, Any]], max_hops: int = 3) -> List[Dict[str, Any]]:
#     """
#     Find short cycles A->B->...->A within <= max_hops edges.
#     transactions: iterable with from_user_id, to_user_id, amount_cents, timestamp
#     """
#     adj: Dict[str, List[str]] = defaultdict(list)
#     for tx in transactions:
#         a = tx.get('from_user_id')
#         b = tx.get('to_user_id')
#         if a and b and a != b:
#             adj[a].append(b)

#     flags: List[Dict[str, Any]] = []

#     def has_cycle(start: str) -> Optional[List[str]]:
#         # bounded DFS
#         stack: List[Tuple[str, List[str]]] = [(start, [start])]
#         while stack:
#             node, path = stack.pop()
#             if len(path) > max_hops:
#                 continue
#             for nxt in adj.get(node, []):
#                 if nxt == start and len(path) > 1:
#                     return path + [start]
#                 if nxt not in path:
#                     stack.append((nxt, path + [nxt]))
#         return None

#     for u in adj.keys():
#         cyc = has_cycle(u)
#         if cyc:
#             flags.append({
#                 'user_id': u,
#                 'flag_type': 'CIRCULAR_FLOW',
#                 'details': {'cycle': cyc},
#             })

#     return flags


# def generate_flag_inserts(flags: List[Dict[str, Any]]) -> List[str]:
#     stmts: List[str] = []
#     for f in flags:
#         user_id = f.get('user_id')
#         related_user_id = f.get('related_user_id')
#         ip = f.get('ip_address') or f.get('details', {}).get('ip')
#         flag_type = f.get('flag_type')
#         details = f.get('details', {})
#         stmt = (
#             "insert into moderation_flags (user_id, related_user_id, ip_address, flag_type, details) values ("
#             f"{sql_str(user_id)}, {sql_str(related_user_id)}, {sql_ip(ip)}, {sql_str(flag_type)}, {sql_json(details)}"
#             ") on conflict do nothing;"
#         )
#         stmts.append(stmt)
#     return stmts


# def sql_str(v: Optional[str]) -> str:
#     if v is None:
#         return 'null'
#     return "'" + str(v).replace("'", "''") + "'"


# def sql_ip(v: Optional[str]) -> str:
#     if not v:
#         return 'null'
#     return sql_str(v)


# def sql_json(obj: Any) -> str:
#     import json
#     return sql_str(json.dumps(obj)) + '::jsonb'

# # ------------------------------
# # API Blueprints
# # ------------------------------

# @ip_checker_blueprint.route("/check", methods=["POST"])
# def check_ip():
#     """
#     Check if an IP address is suspicious
#     ---
#     tags:
#       - IP Monitoring
#     consumes:
#       - application/json
#     produces:
#       - application/json
#     parameters:
#       - in: body
#         name: body
#         required: true
#         schema:
#           type: object
#           required:
#             - ip
#           properties:
#             ip:
#               type: string
#               description: IPv4 or IPv6 address to check
#               example: "203.0.113.7"
#             known_ips:
#               type: array
#               description: List of previously seen IP addresses for the user
#               items:
#                 type: string
#               example: ["203.0.113.1", "198.51.100.22"]
#     responses:
#       200:
#         description: Suspicious check result
#         schema:
#           type: object
#           properties:
#             ip:
#               type: string
#             suspicious:
#               type: boolean
#         examples:
#           application/json:
#             ip: "203.0.113.7"
#             suspicious: true
#       400:
#         description: Bad request (validation error)
#         schema:
#           type: object
#           properties:
#             error:
#               type: string
#     """
#     payload = request.get_json(silent=True) or {}
#     ip_value = payload.get("ip")
#     known_ips = payload.get("known_ips", [])

#     if not isinstance(known_ips, list):
#         return jsonify({"error": "known_ips must be a list"}), 400

#     if not ip_value:
#         return jsonify({"error": "ip is required"}), 400

#     try:
#         # Validate IP format
#         ipaddress.ip_address(ip_value)
#     except ValueError:
#         return jsonify({"error": "invalid ip format"}), 400

#     suspicious = is_suspicious_ip(ip_value, known_ips)
#     return jsonify({"ip": ip_value, "suspicious": suspicious}), 200


# @ip_checker_blueprint.route("/geolocation", methods=["POST"])
# def ip_geolocation():
#     """
#     Get geolocation details for an IP address
#     ---
#     tags:
#       - IP Monitoring
#     consumes:
#       - application/json
#     produces:
#       - application/json
#     parameters:
#       - in: body
#         name: body
#         required: true
#         schema:
#           type: object
#           required:
#             - ip
#           properties:
#             ip:
#               type: string
#               description: IPv4 or IPv6 address to geolocate
#               example: "198.51.100.10"
#             geoip_db_path:
#               type: string
#               description: Optional path to MaxMind GeoLite2 City mmdb file (falls back to GEOIP_DB_PATH env)
#               example: "./GeoLite2-City.mmdb"
#     responses:
#       200:
#         description: Geolocation information
#         schema:
#           type: object
#           properties:
#             ip:
#               type: string
#             geolocation:
#               type: object
#               properties:
#                 country:
#                   type: string
#                 region:
#                   type: string
#                 city:
#                   type: string
#                 latitude:
#                   type: number
#                 longitude:
#                   type: number
#         examples:
#           application/json:
#             ip: "198.51.100.10"
#             geolocation:
#               country: "United States"
#               region: "California"
#               city: "San Francisco"
#               latitude: 37.7749
#               longitude: -122.4194
#       400:
#         description: Bad request (validation error)
#         schema:
#           type: object
#           properties:
#             error:
#               type: string
#       500:
#         description: Server configuration error (missing database)
#         schema:
#           type: object
#           properties:
#             error:
#               type: string
#       502:
#         description: Upstream or lookup error
#         schema:
#           type: object
#           properties:
#             error:
#               type: string
#     """
#     payload = request.get_json(silent=True) or {}
#     ip_value = payload.get("ip")
#     db_path = payload.get("geoip_db_path") or os.getenv("GEOIP_DB_PATH")

#     if not ip_value:
#         return jsonify({"error": "ip is required"}), 400

#     try:
#         ipaddress.ip_address(ip_value)
#     except ValueError:
#         return jsonify({"error": "invalid ip format"}), 400

#     if not db_path or not os.path.exists(db_path):
#         return jsonify({"error": "GeoIP database path not found"}), 500

#     geo = get_ip_geolocation(ip_value, db_path)
#     if geo is None:
#         return jsonify({"error": "failed to retrieve geolocation"}), 502

#     return jsonify({"ip": ip_value, "geolocation": geo}), 200


# @moderation_blueprint.route("/flags", methods=["GET"])
# def list_flags():
#     """
#     List moderation flags (hackathon demo: returns empty array or integrate with DB)
#     ---
#     tags:
#       - Moderation
#     parameters:
#       - in: query
#         name: user_id
#         type: string
#         required: false
#     responses:
#       200:
#         description: List of flags
#         schema:
#           type: array
#           items:
#             type: object
#     """
#     # For hackathon demo without DB integration, return an empty list
#     # If connecting to Supabase/Postgres, query moderation_flags table here
#     return jsonify([])


# @moderation_blueprint.route("/users/<user_id>/risk", methods=["GET"])
# def get_user_risk(user_id):
#     """
#     Get user risk status
#     ---
#     tags:
#       - Moderation
#     responses:
#       200:
#         description: Risk status
#         schema:
#           type: object
#     """
#     # Placeholder: return SAFE
#     return jsonify({"user_id": user_id, "risk_status": "SAFE", "risk_score": 0})


# @moderation_blueprint.route("/users/<user_id>/risk", methods=["POST"])
# def update_user_risk(user_id):
#     """
#     Update user risk status (mark SAFE or BLOCKED)
#     ---
#     tags:
#       - Moderation
#     consumes:
#       - application/json
#     parameters:
#       - in: body
#         name: body
#         required: true
#         schema:
#           type: object
#           required:
#             - risk_status
#           properties:
#             risk_status:
#               type: string
#               enum: [SAFE, REVIEW, BLOCKED]
#             risk_score:
#               type: integer
#     responses:
#       200:
#         description: Updated
#     """
#     payload = request.get_json(silent=True) or {}
#     status = payload.get("risk_status")
#     score = payload.get("risk_score", 0)
#     if status not in {"SAFE", "REVIEW", "BLOCKED"}:
#         return jsonify({"error": "invalid risk_status"}), 400
#     # Placeholder: echo; integrate with user_risk_status table in DB for real use
#     return jsonify({"user_id": user_id, "risk_status": status, "risk_score": score})


# @wallet_blueprint.route("/check-limits", methods=["POST"])
# def check_aml_limits():
#     """
#     Check if a transaction would exceed AML daily limits
#     ---
#     tags:
#       - Wallet
#     consumes:
#       - application/json
#     produces:
#       - application/json
#     parameters:
#       - in: body
#         name: body
#         required: true
#         schema:
#           type: object
#           required:
#             - user_id
#             - amount_cents
#           properties:
#             user_id:
#               type: string
#             amount_cents:
#               type: integer
#             is_verified:
#               type: boolean
#               default: false
#     responses:
#       200:
#         description: Limit check result
#         schema:
#           type: object
#           properties:
#             allowed:
#               type: boolean
#             reason:
#               type: string
#     """
#     payload = request.get_json(silent=True) or {}
#     user_id = payload.get("user_id")
#     amount_cents = payload.get("amount_cents")
#     is_verified = payload.get("is_verified", False)

#     if not user_id or amount_cents is None:
#         return jsonify({"error": "user_id and amount_cents required"}), 400

#     # Placeholder logic - integrate with aml_thresholds and aml_daily_counters tables
#     limit_key = 'VERIFIED_USER_DAILY_LIMIT_CENTS' if is_verified else 'NEW_USER_DAILY_LIMIT_CENTS'
#     daily_limit = 20000 if is_verified else 2000  # $200 vs $20

#     # For demo, assume no previous transactions today
#     allowed = amount_cents <= daily_limit
#     reason = "within_daily_limit" if allowed else "exceeds_daily_limit"

#     return jsonify({
#         "allowed": allowed,
#         "reason": reason,
#         "daily_limit_cents": daily_limit
#     }), 200


# @wallet_blueprint.route("/velocity-check", methods=["POST"])
# def check_velocity():
#     """
#     Check velocity rules against recent events
#     ---
#     tags:
#       - Wallet
#     consumes:
#       - application/json
#     produces:
#       - application/json
#     parameters:
#       - in: body
#         name: body
#         required: true
#         schema:
#           type: object
#           required:
#             - events
#           properties:
#             events:
#               type: array
#               items:
#                 type: object
#                 properties:
#                   timestamp:
#                     type: string
#                   type:
#                     type: string
#                   user_id:
#                     type: string
#                   ip:
#                     type: string
#     responses:
#       200:
#         description: Velocity check results
#         schema:
#           type: object
#           properties:
#             flags:
#               type: array
#     """
#     payload = request.get_json(silent=True) or {}
#     events = payload.get("events", [])

#     if not isinstance(events, list):
#         return jsonify({"error": "events must be a list"}), 400

#     flags = detect_velocity_flags(events)
#     return jsonify({"flags": flags}), 200


# ------------------------------
# Register Blueprints & Run App
# ------------------------------

app.register_blueprint(ip_checker_blueprint, url_prefix="/ip")
app.register_blueprint(trust_log_blueprint, url_prefix="/trust_log")
app.register_blueprint(user_profile_blueprint, url_prefix="/user")
app.register_blueprint(ip_log_blueprint, url_prefix="/ip_log")
app.register_blueprint(current_ip_blueprint, url_prefix="/current_ip")
app.register_blueprint(transaction_blueprint, url_prefix="/transaction")
app.register_blueprint(flagged_transaction_blueprint, url_prefix="/flagged_transaction")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
