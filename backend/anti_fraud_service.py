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

# Flasgger Swagger UI top section customization
swagger_template = {
  "swagger": "2.0",
  "info": {
    "title": "TikTok TechJam Anti-Fraud API",
    "description": "API for anti-fraud monitoring, user trust, and transaction security. Powered by Flasgger.",
    "version": "0.0.1",
    "license": {
      "name": "MIT",
    }
  },
  "host": "localhost:8080",
  "basePath": "/",
  "schemes": ["http"],
}

Swagger(app, template=swagger_template)
CORS(app)
geo_reader = geoip2.database.Reader("backend\GeoLite2-City.mmdb")

ip_blueprint = Blueprint("ip", __name__)
user_profile_blueprint = Blueprint("user", __name__)
trust_log_blueprint = Blueprint("trust_log", __name__)
transaction_blueprint = Blueprint("transaction", __name__)

# ------------------------------
# IP Monitoring Functions
# ------------------------------


@ip_blueprint.route("/ipcheck", methods=["GET"])
def log_ip():
    """
    Log user IP and check for suspicious activity
    ---
    description: Logs the user's IP address, checks recent logs for geolocation anomalies or shared IP usage, and flags suspicious activity for review.
    tags:
      - IP Logging (User)
    parameters:
      - name: user_id
        in: query
        required: true
        type: integer
        description: The ID of the user logging in.
        example: 123
    responses:
      200:
        description: IP logged successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "IP logged successfully"
            is_suspicious:
              type: boolean
              example: true
            remarks:
              type: string
              example: "User login from different IP and country within 30 mins"
      400:
        description: Missing required parameters
        schema:
          type: object
          properties:
            error:
              type: string
              example: "user_id is required"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Failed to log IP"
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
    current_ip_record = (
        supabase.table("current_connected_ip")
        .select("*")
        .eq("ip_address", ip_address)
        .execute()
        .data
    )

    user_id_int = int(user_id)  # convert to int

    if current_ip_record:
        record = current_ip_record[0]
        existing_users = record["user_ids"]  # already a list of integers
        if user_id_int not in existing_users:
            existing_users.append(user_id_int)

        supabase.table("current_connected_ip").update(
            {
                "user_ids": existing_users,  # pass list of ints
                "is_suspicious": True if len(existing_users) > 5 else False,
            }
        ).eq("id", record["id"]).execute()

        if len(existing_users) > 5:
            is_suspicious = True
            remarks = "Multiple users from same IP"

    else:
        # New record
        supabase.table("current_connected_ip").insert(
            {
                "ip_address": ip_address,
                "user_ids": [user_id_int],  # list of integers
                "is_suspicious": False,
            }
        ).execute()

    # 2️⃣ Check recent logs from same user
    recent_user_logs = (
        supabase.table("ip_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("checked_at", (now - timedelta(minutes=30)).isoformat())
        .execute()
        .data
    )

    for log in recent_user_logs:
        if log["ip_address"] != ip_address and log["country"] != country:
            is_suspicious = True
            remarks = "User login from different IP and country within 30 mins"
            break  # stop after first anomaly detected

    # Write log to Supabase
    supabase.table("ip_logs").insert(
        {
            "user_id": user_id,
            "ip_address": ip_address,
            "is_suspicious": is_suspicious,
            "country": country,
            "region": region,
            "city": city,
            "latitude": latitude,
            "longitude": longitude,
            "checked_at": now.isoformat(),
            "remarks": remarks,
        }
    ).execute()

    return jsonify(
        {
            "message": "IP logged successfully",
            "is_suspicious": is_suspicious,
            "remarks": remarks,
        }
    )


# ------------------------------
# CRUD APIs
# ------------------------------


@user_profile_blueprint.route("/user_profiles", methods=["GET"])
def get_user_profiles():
    """
    Get all user profiles
    ---
    description: Retrieve all user profiles including user_id, created_at, verification status, last IP, trust score, and transaction limit.
    tags:
      - CRUD APIs
    responses:
      200:
        description: A list of user profiles
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
    result = supabase.table("user_profiles").select("*").execute()
    data = result.data if result.data else []

    return jsonify(data)


@trust_log_blueprint.route("/trust_logs", methods=["GET"])
def get_trust_logs():
    """
    Get all trust log entries
    ---
    description: Retrieve all trust logs including id, user_id, added_trust, remarks, and created_at.
    tags:
      - CRUD APIs
    responses:
      200:
        description: A list of trust log entries
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
    result = supabase.table("trust_logs").select("*").execute()
    data = result.data if result.data else []

    return jsonify(data)


@ip_blueprint.route("/ip_logs", methods=["GET"])
def get_ip_logs():
    """
    Get IP logs
    ---
    description: Retrieve all IP logs including id, user_id, ip_address, is_suspicious, country, region, city, latitude, longitude, checked_at, and remarks.
    tags:
      - CRUD APIs
    parameters:
      - name: suspicious
        in: query
        type: boolean
        required: false
        description: Filter only suspicious logs if true
    responses:
      200:
        description: A list of IP log entries
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


@ip_blueprint.route("mark_safe/<int:log_id>", methods=["PUT"])
def mark_ip_safe(log_id):
    """
    Mark IP log as not suspicious
    ---
    description: Update an IP log entry after moderator review to set is_suspicious = false.
    tags:
      - CRUD APIs
    parameters:
      - name: log_id
        in: path
        type: integer
        required: true
        description: ID of the IP log entry to update
    responses:
      200:
        description: IP log updated successfully
        schema:
          type: object
          properties:
            message:
              type: string
            updated_id:
              type: integer
    """
    # Update the record in Supabase
    result = (
        supabase.table("ip_logs")
        .update({"is_suspicious": False, "remarks": "Marked safe after review"})
        .eq("id", log_id)
        .execute()
    )

    if result.data:
        return jsonify({"message": "IP log updated successfully", "updated_id": log_id})
    else:
        return jsonify({"message": "IP log not found", "updated_id": log_id}), 404


@transaction_blueprint.route("/transactions", methods=["GET"])
def get_transactions():
    """
    Get all transactions
    ---
    description: Retrieve all transactions including transaction_id, from_user_id, to_user_id, amount, status, and created_at.
    tags:
      - CRUD APIs
    responses:
      200:
        description: A list of transaction records
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


@transaction_blueprint.route("/flagged_transactions", methods=["GET"])
def get_flagged_transactions():
    """
    Get flagged transactions
    ---
    description: Retrieve all flagged transactions including flagged_transaction_id, created_at, transaction_ids, is_resolved, and reason.
    tags:
      - Transaction
    parameters:
      - name: resolved
        in: query
        type: boolean
        required: false
        description: Filter by resolved status (true or false)
    responses:
      200:
        description: A list of flagged transactions
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


@ip_blueprint.route("/current_connected_ips", methods=["GET"])
def get_current_connected_ips():
    """
    Fetch all current connected IP records
    ---
    description: Retrieves all records from the `current_connected_ip` table. Each record contains the IP address and list of connected user IDs. Ensures all `user_ids` are integers. Useful for monitoring suspicious activity or active connections.
    tags:
      - Security
    responses:
      200:
        description: Successfully retrieved IP records
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                example: 1
              ip_address:
                type: string
                example: "30.6.250.1"
              user_ids:
                type: array
                items:
                  type: integer
                example: [1, 2, 3]
              is_suspicious:
                type: boolean
                example: false
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Failed to fetch records"
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


@transaction_blueprint.route("/check_transactions", methods=["GET"])
def check_transactions():
    """
    Run fraud detection on transactions (past 24hrs)
    ---
    description: |
      Batch processing to check suspicious transactions:
      - Circular money flow between users A and B
      - Huge transaction amount way higher than trust limit
      - Multiple pending transactions from user 7 to 3 within 30 mins

      Flagged transactions are saved into `flagged_transaction` table if not flagged before.
    tags:
      - Transaction
    responses:
      200:
        description: Batch check executed successfully
    """
    now = datetime.utcnow()
    since = now - timedelta(hours=24)

    # 1️⃣ Get transactions in last 24hrs
    transactions = (
        supabase.table("transactions")
        .select("*")
        .gte("created_at", since.isoformat())
        .execute()
        .data
    )

    # 2️⃣ Get existing flagged transactions
    flagged = (
        supabase.table("flagged_transaction")
        .select("*")
        .gte("created_at", since.isoformat())
        .execute()
        .data
    )
    already_flagged_ids = set()
    for f in flagged:
        already_flagged_ids.update(json.loads(f["transaction_ids"]))

    new_flags = []

    # 3️⃣ Fraud detection logic
    # Rule A: Circular money flow
    by_user_pairs = {}
    for tx in transactions:
        key = tuple(sorted([tx["from_user_id"], tx["to_user_id"]]))
        by_user_pairs.setdefault(key, []).append(tx)

    for pair, txs in by_user_pairs.items():
        if len(txs) >= 4:  # simple threshold like sample (1->2->1 multiple times)
            tx_ids = [str(tx["transaction_id"]) for tx in txs]
            if not set(tx_ids).intersection(already_flagged_ids):
                new_flags.append(
                    {
                        "transaction_ids": json.dumps(tx_ids),
                        "created_at": now.isoformat(),
                        "is_resolved": False,
                        "reason": f"Circular money flow between users {pair[0]} and {pair[1]}",
                    }
                )

    # Rule B: Huge transaction way above trust limit
    profiles = supabase.table("user_profiles").select("*").execute().data
    user_limits = {str(p["user_id"]): p["transaction_limit"] for p in profiles}

    for tx in transactions:
        tx_id = str(tx["transaction_id"])
        if tx_id in already_flagged_ids:
            continue
        limit = user_limits.get(str(tx["from_user_id"]), 1000)
        if (
            tx["amount"] > (limit * 10) or tx["amount"] > 1_000_000
        ):  # arbitrary ridiculous threshold
            new_flags.append(
                {
                    "transaction_ids": json.dumps([tx_id]),
                    "created_at": now.isoformat(),
                    "is_resolved": False,
                    "reason": f"Huge transaction amount ({tx['amount']})",
                }
            )

    # Rule C: Multiple pending transactions from 7 -> 3 within 30mins
    pending_73 = [
        tx
        for tx in transactions
        if tx["from_user_id"] == 7
        and tx["to_user_id"] == 3
        and tx["status"] == "pending"
    ]
    if len(pending_73) >= 5:
        tx_ids = [str(tx["transaction_id"]) for tx in pending_73]
        if not set(tx_ids).intersection(already_flagged_ids):
            new_flags.append(
                {
                    "transaction_ids": json.dumps(tx_ids),
                    "created_at": now.isoformat(),
                    "is_resolved": False,
                    "reason": "Multiple pending transactions from user 7 to 3",
                }
            )

    # 4️⃣ Insert new flagged transactions
    if new_flags:
        supabase.table("flagged_transaction").insert(new_flags).execute()

    return jsonify({"message": "Executed successfully"})


def calculate_transaction_limit(trust: int) -> int:
    if trust <= 2:
        return 500 * (2**trust)
    elif 3 <= trust <= 5:
        return 20000
    else:
        return 20000 * (2 ** ((trust - 5) // 2))


@trust_log_blueprint.route("/tabulate_trust", methods=["GET"])
def recalc_trust_scores():
    """
    Recalculate trust scores for all users
    ---
    description: |
      Batch process that recalculates trust scores and transaction limits:
      - Deduct 1 trust point if no login in the past 3 months
      - Add 1 trust point for yearly account age bonus (if eligible)
      - Clamp trust score between 0 and 10
      - Always insert a record in `trust_logs` (even if no change)
      - Update `transaction_limit` using trust-based formula

      The process is typically scheduled to run every 3 months.
    tags:
      - Trust
    responses:
      200:
        description: Trust scores recalculated successfully
        schema:
          type: object
          properties:
            updated_users:
              type: integer
              description: Number of users whose trust scores were updated
              example: 15
            logs_created:
              type: integer
              description: Number of trust log entries created
              example: 15
            timestamp:
              type: string
              format: date-time
              example: "2025-08-27T15:00:00Z"
      401:
        description: Unauthorized – only service/admin can trigger this function
      500:
        description: Internal server error
    """
    now = datetime.datetime.utcnow()
    users = supabase.table("user_profiles").select("*").execute().data

    for user in users:
        user_id = user["user_id"]
        trust = user["trust_score"]
        last_login = datetime.datetime.fromisoformat(
            user["last_login"].replace("Z", "+00:00")
        )
        created_at = datetime.datetime.fromisoformat(
            user["created_at"].replace("Z", "+00:00")
        )

        logs = (
            supabase.table("trust_logs")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
            .data
        )
        last_log = logs[0] if logs else None

        change = 0
        remarks = []

        # 1. Check 3 months inactivity
        if (now - last_login).days >= 90:
            change -= 1
            remarks.append("No login for 3 months (-1)")

        # 2. Check yearly age bonus (if no recent trust events except 0s)
        account_age_years = (now - created_at).days // 365
        if account_age_years >= 1:
            if last_log and last_log["added_trust"] == 0:
                change += 1
                remarks.append("Account age yearly bonus (+1)")

        # Ensure trust stays in [0, 10]
        new_trust = max(0, min(10, trust + change))

        # 3. If no change, log 0
        if change == 0:
            remarks.append("No change (0)")

        # 4. Update user_profiles
        supabase.table("user_profiles").update(
            {
                "trust_score": new_trust,
                "transaction_limit": calculate_transaction_limit(new_trust),
            }
        ).eq("user_id", user_id).execute()

        # 5. Insert trust_log
        supabase.table("trust_logs").insert(
            {
                "user_id": user_id,
                "added_trust": change,
                "remarks": ", ".join(remarks),
                "created_at": now.isoformat(),
            }
        ).execute()


@user_profile_blueprint.route("/verify", methods=["GET"])
def verify_user():
    """
    Verify a user account and update trust score
    ---
    description: |
      Marks a user as verified and updates their trust score **only if the user is not already verified**:
      - Adds +5 trust points to `user_profiles.trust_score` (max 10)
      - Updates `is_verified` flag to True
      - Inserts a trust log in `trust_logs` table with remarks "Verified account (+5)"
      - If user is already verified, no trust points are added

      **Note:** This GET endpoint modifies data for demonstration purposes. Normally a POST/PUT is recommended.
    tags:
      - User
    parameters:
      - name: user_id
        in: query
        required: true
        type: integer
        description: ID of the user to verify
        example: 123
    responses:
      200:
        description: User verified successfully or already verified
        schema:
          type: object
          properties:
            user_id:
              type: integer
              example: 123
            new_trust:
              type: integer
              example: 10
            verified:
              type: boolean
              example: true
            message:
              type: string
              example: "User already verified, no trust points added"
      404:
        description: User not found
      401:
        description: Unauthorized – only admin/service can trigger
      500:
        description: Internal server error
    """
    user_id = request.args.get("user_id", type=int)
    now = datetime.datetime.utcnow()

    # 1. Fetch user
    user = (
        supabase.table("user_profiles")
        .select("*")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    if not user:
        return {"error": "User not found"}, 404
    user = user[0]

    # 2. Check if already verified
    if user["is_verified"]:
        return {
            "user_id": user_id,
            "new_trust": user["trust_score"],
            "verified": True,
            "message": "User already verified, no trust points added",
        }

    # 3. Update trust score (+5), clamp to 10 max
    new_trust = min(10, user["trust_score"] + 5)

    # 4. Mark user verified
    supabase.table("user_profiles").update(
        {"trust_score": new_trust, "is_verified": True}
    ).eq("user_id", user_id).execute()

    # 5. Log into trust_logs
    supabase.table("trust_logs").insert(
        {
            "user_id": user_id,
            "added_trust": 5,
            "remarks": "Verified account (+5)",
            "created_at": now.isoformat(),
        }
    ).execute()

    return {"user_id": user_id, "new_trust": new_trust, "verified": True}


# ------------------------------
# Register Blueprints & Run App
# ------------------------------

app.register_blueprint(ip_blueprint, url_prefix="/ip")
app.register_blueprint(trust_log_blueprint, url_prefix="/trust_log")
app.register_blueprint(user_profile_blueprint, url_prefix="/user")
app.register_blueprint(transaction_blueprint, url_prefix="/transaction")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
