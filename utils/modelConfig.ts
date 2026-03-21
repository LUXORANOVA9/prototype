export interface ModelConfig {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
}

const DEFAULT_CONFIG: ModelConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
};

export const getModelConfig = (): ModelConfig => {
    try {
        const stored = localStorage.getItem('luxor9_model_config');
        if (stored) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn("Failed to parse model config", e);
    }
    return DEFAULT_CONFIG;
};

export const saveModelConfig = (config: ModelConfig) => {
    localStorage.setItem('luxor9_model_config', JSON.stringify(config));
};
