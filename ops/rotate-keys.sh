#!/bin/bash
set -e

# Usage: ./rotate-keys.sh <TENANT_ID>

TENANT_ID=$1
if [ -z "$TENANT_ID" ]; then
  echo "Usage: $0 <TENANT_ID>"
  exit 1
fi

echo ">> Starting Key Rotation for $TENANT_ID..."

# 1. Generate new high-entropy key
NEW_KEY="sk-mcp-$(openssl rand -hex 16)"
echo ">> Generated Key: ${NEW_KEY:0:6}..."

# 2. Upload to Secret Manager (Mock GCP Command)
# gcloud secrets versions add mcp-key-${TENANT_ID} --payload="$NEW_KEY"
echo ">> [Mock] Uploaded to GCP Secret Manager."

# 3. Update Database/Vault with new key metadata (Expires in 30 days)
# curl -X POST internal-vault/keys ...
echo ">> [Mock] Registered key in Vault (Valid until $(date -v+30d +%Y-%m-%d))."

# 4. Graceful Switch (Notify Load Balancer / Config)
echo ">> [Mock] Triggering config reload..."

echo ">> Rotation Complete. Old key will remain valid for 24h for drain."
