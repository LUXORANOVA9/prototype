import { GoogleGenAI } from "@google/genai";
import { mcpRouter } from "./mcpRouter";
import { ImageGenerationConfig } from "../types";

// FLUX.1-schnell is the Apache 2.0 open model, much more likely to work freely than dev
const HF_MODEL_FLUX = "black-forest-labs/FLUX.1-schnell"; 
const HF_MODEL_SDXL = "stabilityai/stable-diffusion-xl-base-1.0";

/**
 * Main Entry Point for Image Generation
 * Routes to the best available provider based on config and available keys.
 */
export const generateImage = async (config: ImageGenerationConfig): Promise<{ data: string; provider: string; model: string }> => {
    const googleKey = mcpRouter.getUniversalKey();
    const hfKey = mcpRouter.getHuggingFaceKey();
    
    let provider = config.provider || 'auto';

    // Auto-Routing Logic
    if (provider === 'auto') {
        if (googleKey && !hfKey) provider = 'google';
        else if (!googleKey) provider = 'huggingface'; // Prefer HF if no Google key
        else if (googleKey && hfKey) {
            provider = 'google'; // Prefer Google for speed if both exist
        } else {
            provider = 'google'; // Default try
        }
    }

    try {
        if (provider === 'google') {
            try {
                return await generateWithGemini(config, googleKey);
            } catch (err: any) {
                // BROAD FALLBACK: If Google fails for ANY reason (Quota, Safety, Billing), try HF
                console.warn(`[ImageRouter] Gemini failed (${err.message}). Failing over to HuggingFace FLUX...`);
                return await generateWithHuggingFace(config, hfKey || '');
            }
        } else {
            // Autonomous/Anonymous Attempt: Try even if hfKey is empty
            return await generateWithHuggingFace(config, hfKey || '');
        }
    } catch (error: any) {
        throw new Error(`Image Generation Failed: ${error.message}`);
    }
};

const generateWithGemini = async (config: ImageGenerationConfig, apiKey?: string): Promise<{ data: string; provider: string; model: string }> => {
    if (!apiKey) throw new Error("Google API Key missing.");
    
    const ai = new GoogleGenAI({ apiKey });
    const isPro = config.size === '2K' || config.size === '4K';
    const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const genConfig: any = { imageConfig: { aspectRatio: config.aspectRatio } };
    if (isPro) genConfig.imageConfig.imageSize = config.size;

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: config.prompt }] },
        config: genConfig
    });

    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imgPart?.inlineData) throw new Error("Google Gemini did not return valid image data.");
    
    return {
        data: `data:image/png;base64,${imgPart.inlineData.data}`,
        provider: 'google',
        model: model
    };
};

const generateWithHuggingFace = async (config: ImageGenerationConfig, token: string): Promise<{ data: string; provider: string; model: string }> => {
    const model = HF_MODEL_FLUX;
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-use-cache": "false"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ 
                inputs: config.prompt,
                parameters: {
                    aspect_ratio: config.aspectRatio === '1:1' ? '1:1' : undefined
                } 
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            if (response.status === 503) {
                console.warn("[ImageRouter] FLUX is loading/busy. Trying SDXL...");
                return generateWithHuggingFaceSDXL(config, token);
            }
            if (response.status === 401 && !token) {
                 throw new Error("Anonymous access restricted by provider. Please add a free Hugging Face token in the MCP Panel.");
            }
            throw new Error(`HuggingFace Error (${response.status}): ${errText}`);
        }

        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        
        return {
            data: base64,
            provider: 'huggingface',
            model: model
        };
    } catch (e: any) {
        if (e.message.includes('Failed to fetch')) {
             throw new Error("Network Error: Could not connect to Image Provider (CORS/Blocking). Try disabling ad-blockers or adding a key.");
        }
        throw e;
    }
};

const generateWithHuggingFaceSDXL = async (config: ImageGenerationConfig, token: string): Promise<{ data: string; provider: string; model: string }> => {
    const model = HF_MODEL_SDXL;
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ inputs: config.prompt })
    });

    if (!response.ok) {
         throw new Error(`HuggingFace SDXL Error: ${response.statusText}`);
    }

    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    return {
        data: base64,
        provider: 'huggingface',
        model: model
    };
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};