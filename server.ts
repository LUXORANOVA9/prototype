import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const API_KEY = process.env.GEMINI_API_KEY; // Use standard env var

  app.use(cors());
  app.use(express.json());
  app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms'));

  const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

  const SECRETS_STORE = new Map();
  const VALID_KEYS = new Map();

  const DEMO_TENANT_ID = 'tenant-001';
  const DEMO_KEY_ID = 'key-alpha';
  const DEMO_SECRET = 'sk-mcp-demo-123';
  VALID_KEYS.set(DEMO_SECRET, { 
    id: DEMO_KEY_ID, 
    tenantId: DEMO_TENANT_ID, 
    scopes: ['read', 'write', 'admin'],
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 
  });

  const validateApiKey = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const providedKey = req.body.api_key || (authHeader && authHeader.split(' ')[1]);

    if (!providedKey) {
      return res.status(401).json({ error: { code: 401, message: "Missing API Key" } });
    }

    const keyData = VALID_KEYS.get(providedKey);

    if (!keyData) {
      return res.status(403).json({ error: { code: 403, message: "Invalid API Key" } });
    }

    if (Date.now() > keyData.expiresAt) {
      return res.status(403).json({ error: { code: 403, message: "API Key Expired" } });
    }

    req.ctx = {
      tenantId: keyData.tenantId,
      keyId: keyData.id,
      scopes: keyData.scopes,
      requestId: uuidv4()
    };

    next();
  };

  const HANDLERS: Record<string, any> = {
    fetch_data: async (params: any) => {
      console.log(`[${params.source}] Fetching data...`);
      return { data: "raw_csv_data_content_simulated", size: 1024, source: params.source };
    },
    transform_csv: async (params: any) => {
      console.log(`[Transform] Group by ${params.group_by} calculating ${params.metrics}`);
      return { status: "success", rows: 50, summary: "Aggregated 50 rows" };
    },
    call_model: async (params: any) => {
      if (!ai) return { error: "AI not configured" };
      const model = params.model || "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model: model,
        contents: params.prompt_template || "Analyze this."
      });
      return { output: response.text };
    },
    schedule_job: async (params: any) => {
      console.log(`[Scheduler] Job scheduled at ${params.cron}`);
      return { jobId: uuidv4(), status: "scheduled", nextRun: "2023-10-27T10:00:00Z" };
    }
  };

  const generateExecutionPlan = async (prompt: string) => {
    if (!ai) {
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
      return JSON.parse(response.text || "{}");
    } catch (e) {
      throw new Error("Failed to parse plan from model");
    }
  };

  // API Routes
  app.get('/api/health', (req, res) => {
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

  app.post('/api/v1/ask', validateApiKey, async (req: any, res: any) => {
    try {
      const { prompt, dry_run } = req.body;
      
      console.log(`[${req.ctx.requestId}] Generating plan for: "${prompt}"`);
      const plan = await generateExecutionPlan(prompt);

      if (dry_run) {
        return res.json({ 
          plan, 
          estimated_cost: plan.steps.length * 0.05, 
          message: "Dry run complete. No actions taken." 
        });
      }

      const results = [];
      for (const step of plan.steps) {
        const handler = HANDLERS[step.handler];
        if (!handler) {
          results.push({ step: step.handler, status: "error", error: "Unknown handler" });
          break;
        }

        try {
          const result = await handler(step.params);
          results.push({ step: step.handler, status: "success", output: result });
        } catch (err: any) {
          results.push({ step: step.handler, status: "failed", error: err.message });
        }
      }

      res.json({
        requestId: req.ctx.requestId,
        plan_intent: plan.intent,
        results: results
      });

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: { code: 500, message: "Internal Server Error", details: e.message } });
    }
  });

  app.post('/api/v1/admin/rotate-key', validateApiKey, (req: any, res: any) => {
    if (!req.ctx.scopes.includes('admin')) return res.status(403).send("Admin only");
    
    const newKey = `sk-mcp-${uuidv4()}`;
    VALID_KEYS.set(newKey, { ...VALID_KEYS.get(req.body.old_key), id: uuidv4() });
    
    res.json({ message: "Key rotated", new_key: newKey });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
