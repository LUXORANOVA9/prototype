import { GoogleGenAI } from "@google/genai";
import { mcpRouter } from "./mcpRouter";
import { VideoGenerationConfig, VideoModel } from "../types";

export const VIDEO_MODELS: VideoModel[] = [
  // --- Tier 1: Open-Source / Free Token Models ---
  {
    id: 'Wan-AI/Wan2.1-T2V-1.3B',
    name: 'Wan 2.1 (1.3B)',
    provider: 'huggingface',
    tier: 1,
    capabilities: ['t2v'],
    description: 'Highly efficient open model. Best for quick anonymous generation.',
    apiPath: 'Wan-AI/Wan2.1-T2V-1.3B'
  },
  {
    id: 'THUDM/CogVideoX-5b',
    name: 'CogVideoX 5B',
    provider: 'huggingface',
    tier: 1,
    capabilities: ['t2v'],
    description: 'Premier open-source transformer. (May require token due to load)',
    apiPath: 'THUDM/CogVideoX-5b'
  },
  {
    id: 'stabilityai/stable-video-diffusion-img2vid-xt-1-1',
    name: 'Stable Video Diffusion (SVD)',
    provider: 'huggingface',
    tier: 1,
    capabilities: ['i2v'],
    description: 'Standard for Image-to-Video. Best with 1024x576 inputs.',
    apiPath: 'stabilityai/stable-video-diffusion-img2vid-xt-1-1'
  },
  {
    id: 'genmo/mochi-1-preview',
    name: 'Mochi 1',
    provider: 'huggingface',
    tier: 1,
    capabilities: ['t2v'],
    description: 'High fidelity motion generation.',
    apiPath: 'genmo/mochi-1-preview'
  },
  {
    id: 'Lightricks/LTX-Video',
    name: 'LTX Video',
    provider: 'huggingface',
    tier: 1,
    capabilities: ['t2v', 'i2v'],
    description: 'Fast and versatile video generation.',
    apiPath: 'Lightricks/LTX-Video'
  },

  // --- Tier 2: Specialized & Reliable Free Models ---
  {
    id: 'damo-vilab/text-to-video-ms-1.7b',
    name: 'ModelScope T2V',
    provider: 'huggingface',
    tier: 2,
    capabilities: ['t2v'],
    description: 'Reliable general purpose video generation.',
    apiPath: 'damo-vilab/text-to-video-ms-1.7b'
  },
  {
    id: 'ali-vilab/i2vgen-xl',
    name: 'I2VGen-XL',
    provider: 'huggingface',
    tier: 2,
    capabilities: ['i2v'],
    description: 'Extended image-to-video capabilities.',
    apiPath: 'ali-vilab/i2vgen-xl'
  },
  {
    id: 'cerspense/zeroscope_v2_576w',
    name: 'ZeroScope v2',
    provider: 'huggingface',
    tier: 2,
    capabilities: ['t2v'],
    description: 'Watermark-free, lightweight generation.',
    apiPath: 'cerspense/zeroscope_v2_576w'
  }
];

export const getVideoModels = () => VIDEO_MODELS;

const FALLBACK_MODEL_ID = 'cerspense/zeroscope_v2_576w';

export const generateVideo = async (config: VideoGenerationConfig, modelId?: string): Promise<{ uri: string, provider: string }> => {
  const requestedModelId = modelId || VIDEO_MODELS[0].id;
  const model = VIDEO_MODELS.find(m => m.id === requestedModelId) || VIDEO_MODELS[0];
  
  // Validation
  if (model.capabilities.includes('i2v') && !config.image && config.prompt && !model.capabilities.includes('t2v')) {
      throw new Error(`${model.name} is an Image-to-Video model. Please attach an image.`);
  }

  try {
    if (model.provider === 'google') {
      throw new Error("Veo model is currently disabled. Please use an Open Source alternative.");
    } else if (model.provider === 'huggingface') {
      return await runHuggingFaceGeneration(config, model);
    } else {
      throw new Error(`Provider ${model.provider} not supported yet.`);
    }
  } catch (error: any) {
    // AUTOMATIC FALLBACK LOGIC
    const isAuthError = 
        error.message.includes('Access Restricted') || 
        error.message.includes('Token') || 
        error.message.includes('403') || 
        error.message.includes('401') ||
        error.message.includes('429') ||
        error.message.includes('Quota') ||
        error.message.includes('billing') ||
        error.message.includes('Network Error');

    // If it's the fallback model itself failing, we stop to avoid infinite recursion
    if (requestedModelId === FALLBACK_MODEL_ID) throw error;

    if (isAuthError) {
        // Only fallback if the fallback model supports the task
        if (config.image && !VIDEO_MODELS.find(m => m.id === FALLBACK_MODEL_ID)?.capabilities.includes('i2v')) {
             if (!config.prompt) throw error; // Cannot fallback if strict I2V needed
        }

        console.warn(`[VideoService] Model ${model.name} failed (${error.message}). Auto-switching to fallback: ${FALLBACK_MODEL_ID}.`);
        return await generateVideo(config, FALLBACK_MODEL_ID);
    }

    throw error;
  }
};

const runHuggingFaceGeneration = async (config: VideoGenerationConfig, model: VideoModel): Promise<{ uri: string, provider: string }> => {
    // 1. Smart Token Strategy (Autonomous)
    const token = mcpRouter.getHuggingFaceKey();

    const apiUrl = `https://api-inference.huggingface.co/models/${model.apiPath}`;
    
    // 2. Payload Strategy
    const isSVD = model.id.includes('stable-video-diffusion');
    const headers: Record<string, string> = {
        "x-use-cache": "false",
        "x-wait-for-model": "true" 
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    let response;
    
    try {
        if (isSVD) {
            if (!config.image) throw new Error(`${model.name} requires an image input.`);
            headers["Content-Type"] = "image/png";

            const base64Data = config.image.includes('base64,') ? config.image.split(',')[1] : config.image;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            response = await fetch(apiUrl, { method: "POST", headers, body: bytes });
        } else {
            headers["Content-Type"] = "application/json";
            const payload: any = { inputs: config.prompt };
            if (config.image && model.capabilities.includes('i2v') && !model.capabilities.includes('t2v')) {
                 payload.inputs = config.image; 
            }
            
            response = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(payload) });
        }

        if (!response.ok) {
            const errText = await response.text();
            
            // Handle Cold Boots
            if (response.status === 503 || errText.includes("loading")) {
                const estimatedTime = errText.match(/estimated_time":\s*([\d.]+)/)?.[1];
                const msg = estimatedTime 
                    ? `Model is loading. Estimated wait: ${Math.ceil(parseFloat(estimatedTime))}s.` 
                    : "Model is currently loading (Cold Boot). Please try again in 30s.";
                throw new Error(msg);
            }
            
            if (response.status === 413) throw new Error("Input too large (413).");
            
            // Handle Auth/Quota
            if ((response.status === 403 || response.status === 401)) {
                if (!token) throw new Error(`Access Denied. '${model.name}' requires a Hugging Face Token (Free).`);
                throw new Error("Invalid or Expired Hugging Face Token.");
            }
            
            throw new Error(`HuggingFace Error (${response.status}): ${errText.substring(0, 100)}...`);
        }

        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        
        return { uri: videoUrl, provider: 'huggingface' };
    } catch (e: any) {
        if (e.message.includes('Failed to fetch')) {
             throw new Error("Network Error: Could not connect to Video Provider (CORS/Blocking). Try disabling ad-blockers or adding a key.");
        }
        throw e;
    }
};