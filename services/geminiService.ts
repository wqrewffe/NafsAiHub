
import { GoogleGenAI, GenerateContentResponse, Type as GenAiType } from '@google/genai';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

interface ImagePart {
  mimeType: string;
  data: string; 
}

const buildContents = (prompt: string, image?: ImagePart) => {
    if (!image || !image.data) {
        return prompt;
    }
    // Gemini expects the base64 string without the data URL prefix
    const base64Data = image.data.startsWith('data:') ? image.data.split(',')[1] : image.data;
    return {
        parts: [
            { text: prompt },
            { inlineData: { mimeType: image.mimeType, data: base64Data } }
        ]
    };
};

// Retry logic for handling temporary API failures
const withRetry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            // Retry on 503 (Service Unavailable) or network errors
            const isRetryable = 
                error?.status === 503 || 
                error?.message?.includes('overloaded') ||
                error?.code === 'UNAVAILABLE' ||
                error?.message?.includes('Network');
            
            if (!isRetryable || i === maxRetries - 1) {
                throw error;
            }
            
            // Exponential backoff: 1s, 2s, 4s
            const waitTime = delayMs * Math.pow(2, i);
            console.log(`Retry attempt ${i + 1}/${maxRetries} after ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    throw lastError;
};


export const generateText = async (prompt: string, image?: ImagePart): Promise<string> => {
  if (!apiKey) throw new Error("API key not configured");
  try {
    return await withRetry(async () => {
      const contents = buildContents(prompt, image);
      const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
      });
      return response.text;
    });
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Failed to generate text from Gemini API. The service is temporarily unavailable.');
  }
};

export const generateJson = async (prompt: string, schema: any, image?: ImagePart): Promise<any> => {
    if (!apiKey) throw new Error("API key not configured");
    try {
        return await withRetry(async () => {
            const contents = buildContents(prompt, image);
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                },
            });
            const jsonText = response.text.trim();
            return JSON.parse(jsonText);
        });
    } catch (error) {
        console.error('Error generating JSON:', error);
        throw new Error('Service temporarily unavailable. Please try again in a few moments.');
    }
};

export const generateSubtasks = async (taskText: string): Promise<string[]> => {
    if (!apiKey) throw new Error("API key not configured");
    try {
        const schema = {
            type: GenAiType.OBJECT,
            properties: {
                subtasks: {
                    type: GenAiType.ARRAY,
                    items: { type: GenAiType.STRING },
                    description: "A list of short, actionable sub-tasks."
                }
            },
            required: ['subtasks']
        };

        const prompt = `Break down the following complex task into a series of smaller, actionable sub-tasks. Provide between 3 and 7 sub-tasks. The sub-tasks should be short and clear. Task: "${taskText}"`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.subtasks || [];
    } catch (error) {
        console.error('Error generating subtasks:', error);
        throw new Error('Failed to generate subtasks from Gemini API.');
    }
};


export { GenAiType };
