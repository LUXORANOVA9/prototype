import { McpProfile, McpPlatform } from "../types";

const STORAGE_KEY = 'luxor9_mcp_profiles';

// Helper for safe environment access in browser/node
const getEnvVar = (key: string): string | undefined => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

class RealtimeMcpRouter {
  private profiles: McpProfile[] = [];

  constructor() {
    this.loadProfiles();
  }

  private loadProfiles() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.profiles = parsed.map((p: any) => ({
          ...p,
          platform: p.platform || p.type || 'google'
        }));
      } catch (e) {
        console.error("Failed to parse MCP profiles", e);
        this.profiles = [];
      }
    } else {
      this.profiles = [];
    }
  }

  private saveProfiles() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
  }

  public getProfiles(): McpProfile[] {
    return this.profiles;
  }

  /**
   * Smart Key Retrieval Strategy
   * 1. Check for Active Profile matching platform
   * 2. Check for Autonomous Environment Variables (Free/Auto Connection)
   * 3. Check for ANY Profile matching platform
   * 4. Check for Key Patterns (Heuristics)
   */
  public getSmartKey(platform: McpPlatform): string | null {
     // 1. Explicit Active Match from UI
     const active = this.profiles.find(p => p.isActive && p.platform === platform);
     if (active) return active.key;

     // 2. Autonomous Environment Discovery
     if (platform === 'huggingface') {
         const key = getEnvVar('HF_TOKEN') || getEnvVar('HUGGING_FACE_TOKEN');
         if (key) return key;
     }
     if (platform === 'openai') {
         const key = getEnvVar('OPENAI_API_KEY');
         if (key) return key;
     }
     if (platform === 'anthropic') {
         const key = getEnvVar('ANTHROPIC_API_KEY');
         if (key) return key;
     }
     if (platform === 'replicate') {
         const key = getEnvVar('REPLICATE_API_TOKEN');
         if (key) return key;
     }
     if (platform === 'google' || platform === 'vertex') {
         const key = getEnvVar('API_KEY') || getEnvVar('GOOGLE_API_KEY') || getEnvVar('GEMINI_API_KEY');
         if (key) return key;
     }
     if (platform === 'xai') {
         const key = getEnvVar('XAI_API_KEY');
         if (key) return key;
     }
     if (platform === 'deepseek') {
         const key = getEnvVar('DEEPSEEK_API_KEY');
         if (key) return key;
     }

     // 3. Explicit Inactive Match (Fallback to saved profile)
     const specific = this.profiles.find(p => p.platform === platform);
     if (specific) return specific.key;

     // 4. Pattern Matching (Heuristics for generic keys)
     if (platform === 'huggingface') {
         const hfMatch = this.profiles.find(p => p.key.trim().startsWith('hf_'));
         if (hfMatch) return hfMatch.key;
     }
     
     if (platform === 'openai') {
         const skMatch = this.profiles.find(p => p.key.trim().startsWith('sk-'));
         if (skMatch) return skMatch.key;
     }

     if (platform === 'google') {
         const activeGeneric = this.profiles.find(p => p.isActive);
         if (activeGeneric && !activeGeneric.key.startsWith('hf_') && !activeGeneric.key.startsWith('sk-')) {
             return activeGeneric.key;
         }
     }

     return null;
  }

  public getUniversalKey(): string | undefined {
    return this.getSmartKey('google') || undefined;
  }

  public getHuggingFaceKey(): string | null {
      return this.getSmartKey('huggingface');
  }

  public isProviderConfigured(platform: McpPlatform): boolean {
      return !!this.getSmartKey(platform);
  }

  public addProfile(name: string, key: string, platform: McpPlatform = 'google') {
    const isFirst = this.profiles.length === 0;
    
    // Auto-detect platform if user selected Custom/Google but key is obvious
    let finalPlatform = platform;
    if (platform === 'custom' || platform === 'google') {
        if (key.trim().startsWith('hf_')) finalPlatform = 'huggingface';
        else if (key.trim().startsWith('sk-')) finalPlatform = 'openai';
    }

    const newProfile: McpProfile = {
      id: crypto.randomUUID(),
      name,
      key,
      isActive: isFirst, 
      platform: finalPlatform
    };
    this.profiles.push(newProfile);
    this.saveProfiles();
    return newProfile;
  }

  public removeProfile(id: string) {
    this.profiles = this.profiles.filter(p => p.id !== id);
    this.saveProfiles();
  }

  public setActiveProfile(id: string | null) {
    this.profiles = this.profiles.map(p => ({
      ...p,
      isActive: p.id === id
    }));
    this.saveProfiles();
  }
}

export const mcpRouter = new RealtimeMcpRouter();