-- Unified Anti-Fraud & AML Schema (PostgreSQL / Supabase-compatible)
-- Run this in your database to create all tables and insert example rows.

-- Optional extensions (uncomment if needed)
-- create extension if not exists pgcrypto;

-- ------------------------------
-- User Management
-- ------------------------------

create table if not exists user_profiles (
    user_id            text primary key,
    created_at         timestamptz not null default now(),
    is_verified        boolean not null default false,
    country_code       text,
    phone_number_hash  text
);

-- ------------------------------
-- IP Monitoring
-- ------------------------------

create table if not exists user_known_ips (
    id                bigserial primary key,
    user_id           text not null,
    ip_address        inet not null,
    first_seen_at     timestamptz not null default now(),
    unique (user_id, ip_address)
);

create index if not exists idx_user_known_ips_user_id on user_known_ips (user_id);
create index if not exists idx_user_known_ips_ip on user_known_ips (ip_address);

create table if not exists ip_checks (
    id                bigserial primary key,
    user_id           text,
    ip_address        inet not null,
    is_suspicious     boolean not null,
    country           text,
    region            text,
    city              text,
    latitude          double precision,
    longitude         double precision,
    geolocation_raw   jsonb,
    checked_at        timestamptz not null default now()
);

create index if not exists idx_ip_checks_user_id on ip_checks (user_id);
create index if not exists idx_ip_checks_ip on ip_checks (ip_address);
create index if not exists idx_ip_checks_checked_at on ip_checks (checked_at desc);

-- ------------------------------
-- Wallet & Transactions
-- ------------------------------

create table if not exists wallets (
    wallet_id          bigserial primary key,
    user_id            text not null references user_profiles(user_id) on delete cascade,
    balance_cents      bigint not null default 0,
    currency           text not null default 'USD',
    updated_at         timestamptz not null default now()
);
create index if not exists idx_wallets_user on wallets (user_id);

create table if not exists transactions (
    tx_id              bigserial primary key,
    from_user_id       text references user_profiles(user_id) on delete set null,
    to_user_id         text references user_profiles(user_id) on delete set null,
    amount_cents       bigint not null,
    currency           text not null default 'USD',
    tx_type            text not null, -- DEPOSIT | WITHDRAWAL | TRANSFER | DONATION | GIFT
    status             text not null default 'COMPLETED', -- PENDING | COMPLETED | FAILED | REFUNDED
    created_at         timestamptz not null default now(),
    metadata           jsonb
);
create index if not exists idx_tx_from on transactions (from_user_id, created_at desc);
create index if not exists idx_tx_to on transactions (to_user_id, created_at desc);

-- ------------------------------
-- AML & Daily Limits
-- ------------------------------

create table if not exists aml_daily_counters (
    user_id            text not null references user_profiles(user_id) on delete cascade,
    date               date not null,
    total_out_cents    bigint not null default 0,
    total_in_cents     bigint not null default 0,
    primary key (user_id, date)
);

create table if not exists aml_thresholds (
    key                text primary key,
    value_int          bigint,
    value_text         text
);

-- ------------------------------
-- Moderation & Risk Management
-- ------------------------------

create table if not exists user_risk_status (
    user_id           text primary key,
    risk_status       text not null default 'SAFE', -- SAFE | REVIEW | BLOCKED
    risk_score        integer not null default 0,
    updated_at        timestamptz not null default now()
);

create table if not exists moderation_flags (
    id                bigserial primary key,
    user_id           text,
    related_user_id   text,
    ip_address        inet,
    flag_type         text not null, -- VELOCITY | GEO_JUMP | SHARED_IP | CIRCULAR_FLOW | DEVICE_LINK | FRAUD_ATTEMPT
    details           jsonb,
    status            text not null default 'OPEN', -- OPEN | DISMISSED | ACTIONED
    created_at        timestamptz not null default now(),
    resolved_at       timestamptz
);

create index if not exists idx_mflags_user on moderation_flags (user_id);
create index if not exists idx_mflags_type on moderation_flags (flag_type);
create index if not exists idx_mflags_status on moderation_flags (status);

-- ------------------------------
-- Velocity & Device Tracking
-- ------------------------------

create table if not exists velocity_events (
    id                bigserial primary key,
    user_id           text,
    event_type        text not null, -- LOGIN | DONATION | GIFT
    ip_address        inet,
    created_at        timestamptz not null default now()
);

create index if not exists idx_velocity_user_time on velocity_events (user_id, created_at desc);

create table if not exists device_links (
    id                bigserial primary key,
    user_id           text not null,
    device_fingerprint text not null,
    first_seen_at     timestamptz not null default now(),
    unique (user_id, device_fingerprint)
);

-- ------------------------------
-- Sample Data
-- ------------------------------

-- AML thresholds
insert into aml_thresholds (key, value_int, value_text) values
    ('NEW_USER_DAILY_LIMIT_CENTS', 2000, null),   -- $20
    ('VERIFIED_USER_DAILY_LIMIT_CENTS', 20000, null), -- $200
    ('SUDDEN_JUMP_FACTOR_X', 5, null)
on conflict (key) do nothing;

-- Example users
insert into user_profiles (user_id, is_verified, country_code) values
    ('user_123', false, 'US'),
    ('user_456', true, 'SG'),
    ('user_789', false, 'NG')
on conflict (user_id) do nothing;

-- Known IPs
insert into user_known_ips (user_id, ip_address, first_seen_at) values
    ('user_123', '203.0.113.1', now() - interval '7 days'),
    ('user_123', '198.51.100.22', now() - interval '3 days'),
    ('user_456', '2001:db8::1', now() - interval '10 days')
on conflict (user_id, ip_address) do nothing;

-- IP checks
insert into ip_checks (
    user_id, ip_address, is_suspicious, country, region, city, latitude, longitude, geolocation_raw, checked_at
) values
    (
        'user_123',
        '203.0.113.7',
        true,
        'United States',
        'California',
        'San Francisco',
        37.7749,
        -122.4194,
        '{"country":"United States","region":"California","city":"San Francisco","latitude":37.7749,"longitude":-122.4194}'::jsonb,
        now()
    ),
    (
        'user_123',
        '198.51.100.22',
        false,
        'United States',
        'Washington',
        'Seattle',
        47.6062,
        -122.3321,
        '{"country":"United States","region":"Washington","city":"Seattle","latitude":47.6062,"longitude":-122.3321}'::jsonb,
        now() - interval '1 day'
    ),
    (
        'user_456',
        '2001:db8::2',
        true,
        'Singapore',
        null,
        'Singapore',
        1.3521,
        103.8198,
        '{"country":"Singapore","city":"Singapore","latitude":1.3521,"longitude":103.8198}'::jsonb,
        now() - interval '2 hours'
    );

-- Sample moderation flags
insert into moderation_flags (user_id, ip_address, flag_type, details, created_at) values
    ('user_123', '203.0.113.7', 'GEO_JUMP', '{"from":"US","to":"NG","time_diff_hours":6}'::jsonb, now() - interval '1 hour'),
    ('user_789', '198.51.100.50', 'VELOCITY', '{"reason":"LOGINS_PER_IP_5MIN","count":25}'::jsonb, now() - interval '30 minutes'),
    ('user_456', '2001:db8::2', 'SHARED_IP', '{"shared_with":["user_789","user_999"]}'::jsonb, now() - interval '2 hours');

-- Example velocity events
insert into velocity_events (user_id, event_type, ip_address, created_at) values
    ('user_123', 'LOGIN', '203.0.113.7', now() - interval '5 minutes'),
    ('user_123', 'GIFT', '203.0.113.7', now() - interval '4 minutes'),
    ('user_123', 'GIFT', '203.0.113.7', now() - interval '3 minutes'),
    ('user_789', 'LOGIN', '198.51.100.50', now() - interval '10 minutes'),
    ('user_789', 'LOGIN', '198.51.100.50', now() - interval '9 minutes'),
    ('user_789', 'LOGIN', '198.51.100.50', now() - interval '8 minutes');

-- Device links
insert into device_links (user_id, device_fingerprint, first_seen_at) values
    ('user_123', 'device_hash_abc123', now() - interval '7 days'),
    ('user_789', 'device_hash_abc123', now() - interval '6 days'), -- Same device, different user
    ('user_456', 'device_hash_def456', now() - interval '10 days')
on conflict (user_id, device_fingerprint) do nothing;

-- ------------------------------
-- Example Queries
-- ------------------------------

-- Latest checks per user
-- select * from ip_checks where user_id = 'user_123' order by checked_at desc limit 50;

-- Users with multiple devices
-- select device_fingerprint, count(*) as user_count from device_links group by device_fingerprint having count(*) > 1;

-- Recent velocity events
-- select user_id, event_type, count(*) from velocity_events where created_at > now() - interval '1 hour' group by user_id, event_type;

-- Open moderation flags
-- select * from moderation_flags where status = 'OPEN' order by created_at desc;
