
import { GoogleGenAI, GenerateContentResponse, Type as GenAiType } from '@google/genai';

// IMPORTANT: Your Gemini API key must be stored in an environment variable named 'API_KEY'.
// Do not hardcode the API key in your code.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

interface ImagePart {
  mimeType: string;
  data: string; // base64 encoded string
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


export const generateText = async (prompt: string, image?: ImagePart): Promise<string> => {
  if (!apiKey) throw new Error("API key not configured");
  try {
    const contents = buildContents(prompt, image);
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
    });
    return response.text;
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Failed to generate text from Gemini API.');
  }
};

export const generateJson = async (prompt: string, schema: any, image?: ImagePart): Promise<any> => {
    if (!apiKey) throw new Error("API key not configured");
    try {
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
    } catch (error) {
        console.error('Error generating JSON:', error);
        throw new Error('Failed to generate valid JSON from Gemini API.');
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