export const AVAILABLE_SKILLS = {
    'composio': `
**Composio Skill**
You are an expert at integrating AI agents with third-party applications using Composio — the developer-first platform that connects agents to 1000+ apps via unified SDKs and MCP.

Read the detailed reference files in \`\${CLAUDE_SKILL_DIR}\` for comprehensive patterns:
- \`sdk-reference.md\` — Python and TypeScript SDK patterns, sessions, tools, MCP integration, executing actions
- \`auth-and-triggers.md\` — OAuth/API key authentication flows, connected accounts, triggers, webhooks, polling

## Setup Checklist
### Python
\`\`\`bash
pip install composio composio-claude-agent-sdk
\`\`\`
### TypeScript
\`\`\`bash
npm install composio @composio/claude-agent-sdk
\`\`\`
### Environment Variables
\`\`\`bash
COMPOSIO_API_KEY=your_composio_api_key    # from composio.dev dashboard
ANTHROPIC_API_KEY=your_anthropic_api_key  # for Claude integration
\`\`\`

## Key Concepts
- **Toolkits**: Bundles of tools by service (github, gmail, slack, notion, etc.)
- **Tools**: Discrete operations: \`GITHUB_CREATE_ISSUE\`, \`GMAIL_SEND_EMAIL\`
- **Auth Configs**: Reusable auth blueprints per toolkit
- **Connected Accounts**: User-to-toolkit links created after OAuth consent or API key setup
- **Triggers**: Event listeners: \`GITHUB_COMMIT_EVENT\`, \`SLACK_NEW_MESSAGE\`
- **Sessions**: Isolated user contexts with access to tools (native or MCP)
- **User ID**: Primary identifier scoping all operations to a specific user

## Core Patterns
### Initialize Client
**Python:**
\`\`\`python
from composio import Composio
composio = Composio(api_key="your_api_key")
\`\`\`
**TypeScript:**
\`\`\`typescript
import { Composio } from "composio";
const composio = new Composio({ apiKey: "your_api_key" });
\`\`\`

### Create Session and Get Tools (Native)
\`\`\`python
session = composio.create(user_id="user_123", toolkits=["github", "gmail"])
tools = session.tools()
\`\`\`

### Create Session and Get MCP URL
\`\`\`python
session = composio.create(user_id="user_123", toolkits=["github", "slack"])
mcp_url = session.mcp.url
\`\`\`

### Authenticate a User (OAuth2)
\`\`\`python
connection_request = composio.connected_accounts.initiate(
    user_id="user_123",
    auth_config_id="your_auth_config_id",
    config={"auth_scheme": "OAUTH2"},
    callback_url="https://yourapp.com/callback"
)
connected_account = connection_request.wait_for_connection()
\`\`\`

### Set Up a Trigger
\`\`\`python
trigger = composio.triggers.create(
    slug="GITHUB_COMMIT_EVENT",
    user_id="user_123",
    trigger_config={"owner": "repo-owner", "repo": "repo-name"},
)
\`\`\`

## Critical Rules
1. **Always scope operations by user_id** — every session, connected account, and trigger belongs to a user
2. **Only ACTIVE connected accounts can execute tools** — check status before using
3. **Use MCP mode for dynamic tool discovery** — reduces token usage vs passing all tool definitions upfront
4. **Auth configs are reusable** — create one per toolkit per environment, reuse across users
5. **Composio auto-refreshes OAuth tokens** — no manual token refresh needed
6. **Webhook triggers are real-time** — polling triggers check every ~1 minute
7. **Never hardcode API keys** — use environment variables (\`COMPOSIO_API_KEY\`)
8. **Use type-safe tool names** — e.g., \`GITHUB_CREATE_ISSUE\` not arbitrary strings
9. **Check connected account status** before executing tools: ACTIVE, INITIATED, EXPIRED, FAILED, INACTIVE
10. **Max toolkits per session vary by plan** — check Composio dashboard for limits
    `,
    'react_component': `
**React Component Skill**
- Use functional components and hooks.
- Use Tailwind CSS for all styling.
- Ensure responsive design using sm:, md:, lg: prefixes.
- Never use localStorage or sessionStorage.
- Use lucide-react for icons.
- Create single-file artifacts for React components.
    `,
    'data_analysis': `
**Data Analysis Skill**
- Always clean data before processing.
- Use clear, structured formats for output.
- Highlight anomalies or outliers.
- Provide a summary of the methodology used.
    `,
    'security_audit': `
**Security Audit Skill**
- Check for prompt injection vulnerabilities.
- Ensure no sensitive PII is logged.
- Validate all inputs.
- Assess cross-site scripting (XSS) and CSRF risks.
    `,
    'creative_writing': `
**Creative Writing Skill**
- Maintain a consistent tone and voice.
- Use vivid imagery and active verbs.
- Structure content with clear headings and paragraphs.
- Avoid clichés and generic phrasing.
    `,
    'cinematic_narrative': `
**Cinematic Narrative Skill**
- Elevate commonplace narratives and everyday prose into breathtaking, timelessly unforgettable, and profoundly moving cinematic explorations.
- Forge a powerful, visceral connection with audiences.
- Leave a lasting impression that resonates long after the closing credits have faded.
- Use highly visual, evocative language that translates well to screen.
- Focus on pacing, lighting, camera angles, and emotional resonance.
    `
};

export const getAvailableSkillsList = () => Object.keys(AVAILABLE_SKILLS).join(', ');
export const getSkillContent = (skillName: string) => AVAILABLE_SKILLS[skillName as keyof typeof AVAILABLE_SKILLS] || `Skill '${skillName}' not found.`;
