#!/bin/bash
# make-admin.sh
# Usage: ./make-admin.sh user@example.com

if [ -z "$1" ]; then
  echo "Usage: ./make-admin.sh <email>"
  echo "Example: ./make-admin.sh user@example.com"
  exit 1
fi

EMAIL=$1
ADMIN_SECRET=${ADMIN_SECRET}
BASE_URL=${BASE_URL:-"http://localhost:3000"}

if [ -z "$ADMIN_SECRET" ]; then
  echo "ERROR: ADMIN_SECRET must be set in the environment." >&2
  exit 1
fi

echo "Making user admin: $EMAIL"

RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/make-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"adminSecret\": \"$ADMIN_SECRET\"
  }")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "promoted to admin"; then
  echo "✅ User $EMAIL has been successfully promoted to admin!"
else
  echo "❌ Failed to promote user to admin. Check the response above for details."
  exit 1
fi
