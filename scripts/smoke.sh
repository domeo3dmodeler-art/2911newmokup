#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:${PORT:-3000}}"
TOKEN="${SMOKE_TOKEN:-smoke}"

echo "[SMOKE] BASE=${BASE}"

# --- helpers ----------------------------------------------------

# Вернуть ТОЛЬКО HTTP-код (без заголовков/тела)
code_only() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

# Вернуть только заголовки (для проверки Content-Type)
headers_only() {
  curl -sS -D - -o /dev/null "$@"
}

assert_eq() {
  local expected="$1"; shift
  local actual="$1"; shift
  local msg_ok="$1"; shift
  local msg_fail="$1"; shift
  if [[ "$actual" == "$expected" ]]; then
    echo "✓ $msg_ok"
  else
    echo "✗ $msg_fail (expected $expected, got $actual)" >&2
    exit 1
  fi
}

has_header() {
  local headers="$1"; shift
  local name="$1"; shift
  local contains="$1"; shift
  echo "$headers" | grep -iE "^${name}:" | grep -qi "$contains"
}

# --- checks -----------------------------------------------------

echo "== /api/health =="
code="$(code_only "${BASE}/api/health")"
assert_eq "204" "$code" "204 No Content" "health wrong status"

echo "== /api/admin/ping =="
code="$(code_only -H "Authorization: Bearer ${TOKEN}" "${BASE}/api/admin/ping")"
assert_eq "200" "$code" "200 OK" "admin/ping wrong status"

BODY='{"cart": []}'

echo "== Export: KP (HTML) =="
hdr="$(headers_only -X POST -H "Content-Type: application/json" -d "$BODY" "${BASE}/api/cart/export/doors/kp")"
code="$(echo "$hdr" | awk 'NR==1{print $2}')"
assert_eq "200" "$code" "KP 200" "KP wrong status"
if has_header "$hdr" "Content-Type" "text/html"; then
  echo "✓ Content-Type: text/html"
else
  echo "✗ KP must return text/html" >&2; exit 1
fi

echo "== Export: Invoice (HTML) =="
hdr="$(headers_only -X POST -H "Content-Type: application/json" -d "$BODY" "${BASE}/api/cart/export/doors/invoice")"
code="$(echo "$hdr" | awk 'NR==1{print $2}')"
assert_eq "200" "$code" "Invoice 200" "Invoice wrong status"
if has_header "$hdr" "Content-Type" "text/html"; then
  echo "✓ Content-Type: text/html"
else
  echo "✗ Invoice must return text/html" >&2; exit 1
fi

echo "== Export: Factory (CSV) =="
hdr="$(headers_only -X POST -H "Content-Type: application/json" -d "$BODY" "${BASE}/api/cart/export/doors/factory")"
code="$(echo "$hdr" | awk 'NR==1{print $2}')"
assert_eq "200" "$code" "Factory 200" "Factory wrong status"
if has_header "$hdr" "Content-Type" "text/csv"; then
  echo "✓ Content-Type: text/csv"
else
  echo "✗ Factory must return text/csv" >&2; exit 1
fi

echo "✅ SMOKE PASSED"
