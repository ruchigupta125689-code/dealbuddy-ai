#!/usr/bin/env bash
# Runs supabase/schema.sql + RLS assertions against a local Postgres.
# Usage: PGHOST=/tmp PGPORT=54329 PGUSER=postgres bash tests/db/run.sh
set -euo pipefail
cd "$(dirname "$0")"
P="psql -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists dealbuddy_test" -c "create database dealbuddy_test" >/dev/null
$P -d dealbuddy_test -f supabase-stub.sql >/dev/null
$P -d dealbuddy_test -f ../../supabase/schema.sql >/dev/null 2>&1
$P -d dealbuddy_test -f ../../supabase/schema.sql >/dev/null 2>&1   # idempotent
$P -d dealbuddy_test -f rls-test.sql
