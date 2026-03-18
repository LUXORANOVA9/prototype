const fs = require('fs');
const os = require('os');
const path = require('path');
try {
  const p = path.join(os.homedir(), '.gemini/antigravity/brain/c81f8844-2677-4122-97d0-61ebefc44573/.system_generated/logs/overview.txt');
  const content = fs.readFileSync(p, 'utf8');
  console.log(content);
} catch (e) {
  console.error(e);
}
