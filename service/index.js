import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';

// --- Configuration ---
const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.PROJECT_ID || 'local-dev';
const API_KEY = process.env.API_KEY; // Google GenAI Key

// --- Initialization ---
const app = express();
app.use(cors());
app.use(express.json());
// Structured logging
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms'));

// AI Client
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// --- Mock Secret Manager / KMS (In-Memory for Demo) ---
const SECRETS_STORE = new Map();
const VALID_KEYS = new Map();

// Initialize a demo key
const DEMO_TENANT_ID = 'tenant-001';
const DEMO_KEY_ID = 'key-alpha';
const DEMO_SECRET = 'sk-mcp-demo-123';
VALID_KEYS.set(DEMO_SECRET, { 
  id: DEMO_KEY_ID, 
  tenantId: DEMO_TENANT_ID, 
  scopes: ['read', 'write', 'admin'],
  expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
});

// --- Middleware: Security & Auth ---
const validateApiKey = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const providedKey = req.body.api_key || (authHeader && authHeader.split(' ')[1]);

  if (!providedKey) {
    return res.status(401).json({ error: { code: 401, message: "Missing API Key" } });
  }

  // In prod: Check cache -> fallback to Secret Manager/Vault -> Verify JWT signature
  const keyData = VALID_KEYS.get(providedKey);

  if (!keyData) {
    return res.status(403).json({ error: { code: 403, message: "Invalid API Key" } });
  }

  if (Date.now() > keyData.expiresAt) {
    return res.status(403).json({ error: { code: 403, message: "API Key Expired" } });
  }

  // Attach context
  req.ctx = {
    tenantId: keyData.tenantId,
    keyId: keyData.id,
    scopes: keyData.scopes,
    requestId: uuidv4()
  };

  next();
};

// --- Core Logic: Intent Parsing & Execution ---

// 1. Handlers (The "Capabilities")
const HANDLERS = {
  fetch_data: async (params) => {
    // Simulating data fetch from GCS/S3 or API
    console.log(`[${params.source}] Fetching data...`);
    return { data: "raw_csv_data_content_simulated", size: 1024, source: params.source };
  },
  transform_csv: async (params) => {
    // Simulating Pandas/DuckDB op
    console.log(`[Transform] Group by ${params.group_by} calculating ${params.metrics}`);
    return { status: "success", rows: 50, summary: "Aggregated 50 rows" };
  },
  call_model: async (params) => {
    if (!ai) return { error: "AI not configured" };
    // Call Gemini
    const model = params.model || "gemini-3-flash-preview";
    const response = await ai.models.generateContent({
      model: model,
      contents: params.prompt_template || "Analyze this."
    });
    return { output: response.text };
  },
  schedule_job: async (params) => {
    console.log(`[Scheduler] Job scheduled at ${params.cron}`);
    return { jobId: uuidv4(), status: "scheduled", nextRun: "2023-10-27T10:00:00Z" };
  }
};

// 2. Planner
const generateExecutionPlan = async (prompt) => {
  if (!ai) {
    // Fallback deterministic plan for demo without API key
    return {
      intent: "mock_execution",
      steps: [
        { handler: "fetch_data", params: { source: "mock://bucket/data.csv" } },
        { handler: "call_model", params: { model: "gemini-3-flash-preview", prompt_template: `Analyze: ${prompt}` } }
      ]
    };
  }

  const systemPrompt = `
    You are the MCP Orchestrator. 
    Convert the user's Natural Language request into a JSON Execution Plan.
    Available Handlers: ${Object.keys(HANDLERS).join(', ')}.
    
    Output Format:
    {
      "intent": "string_summary",
      "steps": [
        { "handler": "handler_name", "params": { "key": "value" } }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      systemInstruction: systemPrompt
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    throw new Error("Failed to parse plan from model");
  }
};

// --- Routes ---

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0', 
    region: process.env.REGION || 'unknown',
    uptime: process.uptime(),
    mcp_connections: {
      ai_provider: ai ? 'connected' : 'disconnected',
      secrets_store: 'active'
    },
    active_agents: Object.keys(HANDLERS)
  });
});

app.post('/v1/ask', validateApiKey, async (req, res) => {
  try {
    const { prompt, dry_run } = req.body;
    
    // 1. Intent Parsing
    console.log(`[${req.ctx.requestId}] Generating plan for: "${prompt}"`);
    const plan = await generateExecutionPlan(prompt);

    if (dry_run) {
      return res.json({ 
        plan, 
        estimated_cost: plan.steps.length * 0.05, 
        message: "Dry run complete. No actions taken." 
      });
    }

    // 2. Execution
    const results = [];
    for (const step of plan.steps) {
      const handler = HANDLERS[step.handler];
      if (!handler) {
        results.push({ step: step.handler, status: "error", error: "Unknown handler" });
        break; // Stop on error
      }

      // Execute
      try {
        const result = await handler(step.params);
        results.push({ step: step.handler, status: "success", output: result });
      } catch (err) {
        results.push({ step: step.handler, status: "failed", error: err.message });
      }
    }

    // 3. Response
    res.json({
      requestId: req.ctx.requestId,
      plan_intent: plan.intent,
      results: results
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: { code: 500, message: "Internal Server Error", details: e.message } });
  }
});

// Admin Route: Key Rotation
app.post('/v1/admin/rotate-key', validateApiKey, (req, res) => {
  if (!req.ctx.scopes.includes('admin')) return res.status(403).send("Admin only");
  
  // Logic to generate new key and invalidate old one would go here
  const newKey = `sk-mcp-${uuidv4()}`;
  VALID_KEYS.set(newKey, { ...VALID_KEYS.get(req.body.old_key), id: uuidv4() });
  
  res.json({ message: "Key rotated", new_key: newKey });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`[Dev] Test with API Key: ${DEMO_SECRET}`);
});