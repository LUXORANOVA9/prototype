export const AVAILABLE_SKILLS = {
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
