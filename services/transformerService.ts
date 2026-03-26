import { pipeline, env } from '@xenova/transformers';

// Disable local models to prevent downloading large files to the browser
env.allowLocalModels = false;

// We'll use a singleton pattern to keep the model loaded in memory
class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any = null;

    static async getInstance(progress_callback?: Function) {
        if (this.instance === null) {
            this.instance = pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}

export const generateLocalEmbedding = async (text: string): Promise<number[]> => {
    try {
        const extractor = await PipelineSingleton.getInstance();
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (error) {
        console.error("Local embedding failed:", error);
        throw error;
    }
};

class ClassificationSingleton {
    static task = 'text-classification';
    static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    static instance: any = null;

    static async getInstance(progress_callback?: Function) {
        if (this.instance === null) {
            this.instance = pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}

export const analyzeSentimentLocal = async (text: string): Promise<{ label: string, score: number }> => {
    try {
        const classifier = await ClassificationSingleton.getInstance();
        const output = await classifier(text);
        return output[0];
    } catch (error) {
        console.error("Local classification failed:", error);
        throw error;
    }
};
