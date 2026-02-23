import { GoogleGenAI } from "@google/genai";
import { mcpRouter } from "./mcpRouter";

export const getClient = () => {
  const universalKey = mcpRouter.getUniversalKey();
  if (!universalKey) throw new Error("Access Credential missing. Configure API Key in Hub.");
  return new GoogleGenAI({ apiKey: universalKey });
};

export const getEmbedding = async (text: string): Promise<number[] | null> => {
    try {
        const ai = getClient();
        const result = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: { parts: [{ text }] }
        });
        return result.embeddings?.[0]?.values || null;
    } catch (e) {
        console.warn("Embedding generation failed", e);
        return null;
    }
};
