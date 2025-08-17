
import { GoogleGenAI, GenerateContentResponse, Type as GenAiType } from '@google/genai';

// IMPORTANT: Your Gemini API key must be stored in an environment variable named 'API_KEY'.
// Do not hardcode the API key in your code.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generateText = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API key not configured");
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Failed to generate text from Gemini API.');
  }
};

export const generateJson = async (prompt: string, schema: any): Promise<any> => {
    if (!apiKey) throw new Error("API key not configured");
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
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

export { GenAiType };
