# MCP Server Operational Runbook

## Service Overview
The MCP Server acts as the central orchestration node for AI agents, translating natural language into execution plans.

## 1. Secrets Management
We use a **rotation-first** policy. Keys live for 30 days.

### Rotating API Keys
Run the rotation script from the `ops/` directory:
```bash
./ops/rotate-keys.sh --tenant tenant-001 --env prod
```
**Verification:**
After rotation, verify the new key works:
```bash
curl -X POST https://api.mcp.internal/v1/ask \
  -H "Authorization: Bearer <NEW_KEY>" \
  -d '{"prompt": "test connection", "dry_run": true}'
```

## 2. Deployment
### Manual Rollout (Emergency)
```bash
kubectl rollout restart deployment mcp-server -n prod
```

### Rollback
If error rate > 1%:
```bash
kubectl rollout undo deployment mcp-server -n prod
```

## 3. Troubleshooting
**Symptoms:** 500 Errors on `/v1/ask`.
1. Check Pod Logs: `kubectl logs -l app=mcp-server --tail=100`
2. Check Quota: Verify Google GenAI quota in GCP Console.
3. Check Memory: If OOMKilled, increase limits in `infra/k8s/deployment.yaml`.
