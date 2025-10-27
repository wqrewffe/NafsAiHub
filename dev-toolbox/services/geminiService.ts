
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export interface MemeCaption {
    topText: string;
    bottomText: string;
}

export const generateText = async (prompt: string, systemInstruction?: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        ...(systemInstruction && { config: { systemInstruction } }),
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text:", error);
    return `Error: ${getErrorMessage(error)}`;
  }
};

export const generateCommitMessage = async (diff: string): Promise<string> => {
  const prompt = `Based on the following git diff, generate a concise and conventional commit message. The diff is:\n\n\`\`\`diff\n${diff}\n\`\`\``;
  return generateText(prompt, "You are an expert at writing conventional git commit messages.");
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1'): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error(getErrorMessage(error));
  }
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<{imageUrl: string | null, text: string | null}> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        let imageUrl: string | null = null;
        let text: string | null = null;
        
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                text = part.text;
            } else if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const outMimeType = part.inlineData.mimeType;
                imageUrl = `data:${outMimeType};base64,${base64ImageBytes}`;
            }
        }
        return { imageUrl, text };
    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error(getErrorMessage(error));
    }
};

export const generateMemeCaption = async (base64ImageData: string, mimeType: string): Promise<MemeCaption> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    { text: "Generate a funny meme caption for this image. Provide a top text and a bottom text." },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topText: { type: Type.STRING },
                        bottomText: { type: Type.STRING },
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return {
            topText: parsed.topText || '',
            bottomText: parsed.bottomText || '',
        };
    } catch (error) {
        console.error("Error generating meme caption:", error);
        throw new Error(getErrorMessage(error));
    }
};

export const generateMultiPanelMemeCaptions = async (images: { base64ImageData: string; mimeType: string }[]): Promise<MemeCaption[]> => {
    try {
        const imageParts = images.map(image => ({
            inlineData: {
                data: image.base64ImageData,
                mimeType: image.mimeType,
            },
        }));

        const textPart = {
            text: `Analyze these images in order from left-to-right, top-to-bottom. They form a multi-panel meme. Generate a funny, thematically connected meme caption for each image. For each image, provide a top text and a bottom text. Ensure the captions tell a cohesive story or joke across the panels.`
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [textPart, ...imageParts],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        captions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    topText: { type: Type.STRING },
                                    bottomText: { type: Type.STRING },
                                },
                                required: ['topText', 'bottomText'],
                            },
                        },
                    },
                    required: ['captions'],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (parsed.captions && Array.isArray(parsed.captions)) {
            return parsed.captions.map((c: any) => ({
                topText: c.topText || '',
                bottomText: c.bottomText || '',
            }));
        }
        
        throw new Error("AI response did not match the expected format.");

    } catch (error) {
        console.error("Error generating multi-panel meme captions:", error);
        throw new Error(getErrorMessage(error));
    }
};

// FIX: Add missing AI functions to resolve import errors in various components.
export const generateDomainIdeas = async (keywords: string): Promise<string[]> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a list of 10 creative and available-sounding domain name ideas for a project about: "${keywords}". The domain names should be short, memorable, and preferably end in .com or .io. Return a JSON object with a key "domains" containing an array of strings.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              domains: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['domains'],
          },
        },
      });
  
      const jsonText = response.text.trim();
      const parsed = JSON.parse(jsonText);
      
      if (parsed.domains && Array.isArray(parsed.domains)) {
          return parsed.domains;
      }
      
      throw new Error("AI response did not match the expected format.");
  
    } catch (error) {
      console.error("Error generating domain ideas:", error);
      return [`Error: ${getErrorMessage(error)}`];
    }
};

export const generateTweet = async (topic: string): Promise<string> => {
    const prompt = `Write a viral-style tweet about the following topic: "${topic}". Include relevant hashtags.`;
    return generateText(prompt, "You are an expert social media manager known for witty and engaging tweets.");
};

export const generateHashtags = async (topic: string): Promise<string> => {
    const prompt = `Generate a list of relevant and trending hashtags for a social media post about: "${topic}". Provide them as a single line, separated by spaces.`;
    return generateText(prompt, "You are a social media expert specializing in hashtag optimization.");
};

export const generateBlogPostIdeas = async (topic:string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a list of 5 engaging blog post titles/ideas about the following topic: "${topic}". Return a JSON object with a key "ideas" containing an array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ideas: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                    },
                    required: ['ideas'],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        if (parsed.ideas && Array.isArray(parsed.ideas)) {
            return parsed.ideas;
        }
        
        throw new Error("AI response did not match the expected format.");
    } catch (error) {
        console.error("Error generating blog post ideas:", error);
        return [`Error: ${getErrorMessage(error)}`];
    }
};

export const generateRegex = async (description: string): Promise<string> => {
    const prompt = `Based on the following description, generate a JavaScript-compatible regular expression pattern. Return only the regex pattern itself, without any slashes or flags. Description: "${description}"`;
    return generateText(prompt, "You are an expert in writing regular expressions.");
};

export const explainCode = async (code: string, language: string): Promise<string> => {
    const prompt = `Explain the following ${language} code snippet. Use simple terms and provide a step-by-step breakdown. Use markdown for formatting.\n\n\`\`\`${language}\n${code}\n\`\`\``;
    return generateText(prompt, "You are an expert programmer who is great at explaining complex code to beginners.");
};

export const summarizeContent = async (content: string): Promise<string> => {
    const prompt = `Summarize the following text into a few key bullet points. The text is:\n\n"${content}"`;
    return generateText(prompt, "You are an expert at summarizing long-form content into concise, easy-to-understand points.");
};
