# MCP Server Sample Prompts

## 1. Simple Data Retrieval
**Prompt:**
"Fetch the latest sales report from the 'finance-daily' bucket."

**Generated Plan:**
```json
{
  "intent": "get_sales_report",
  "steps": [
    { "handler": "fetch_data", "params": { "source": "gs://finance-daily/latest.csv" } }
  ]
}
```

## 2. Multi-Step Analysis
**Prompt:**
"Pull the user metrics from S3, aggregate by country, and summarize the trends using the AI model."

**Generated Plan:**
```json
{
  "intent": "analyze_user_metrics",
  "steps": [
    { "handler": "fetch_data", "params": { "source": "s3://metrics/users.csv" } },
    { "handler": "transform_csv", "params": { "op": "aggregate", "group_by": "country", "metrics": "count" } },
    { "handler": "call_model", "params": { "prompt_template": "Summarize these country trends: {{prev_output}}" } }
  ]
}
```

## 3. Infrastructure Ops
**Prompt:**
"Schedule a database backup job for every night at 3 AM."

**Generated Plan:**
```json
{
  "intent": "schedule_backup",
  "steps": [
    { "handler": "schedule_job", "params": { "job_type": "db_backup", "cron": "0 3 * * *" } }
  ]
}
```

## 4. API Usage (cURL)

**Generate a Plan (Dry Run):**
```bash
curl -X POST http://localhost:8080/v1/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-mcp-demo-123" \
  -d '{
    "api_key": "sk-mcp-demo-123",
    "prompt": "Summarize the Q3 financial data",
    "dry_run": true
  }'
```

**Execute a Task:**
```bash
curl -X POST http://localhost:8080/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "sk-mcp-demo-123",
    "prompt": "Fetch data from source-a and analyze it"
  }'
```
