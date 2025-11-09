
import { AITool, ApprovalStatus } from './types';

export const DUMMY_TOOLS: AITool[] = [
  {
    id: '1',
    name: 'Gemini',
    link: 'https://gemini.google.com/',
    description: 'A powerful, multimodal AI model from Google capable of understanding and generating text, images, audio, and video.',
    keywords: ['multimodal', 'llm', 'google', 'chat'],
    imageBase64: 'https://picsum.photos/seed/gemini/400/300',
    status: ApprovalStatus.Approved,
    submittedBy: 'admin@example.com',
  },
  {
    id: '2',
    name: 'Midjourney',
    link: 'https://www.midjourney.com/',
    description: 'An independent research lab exploring new mediums of thought and expanding the imaginative powers of the human species.',
    keywords: ['image generation', 'ai art', 'creative'],
    imageBase64: 'https://picsum.photos/seed/midjourney/400/300',
    status: ApprovalStatus.Approved,
    submittedBy: 'admin@example.com',
  },
  {
    id: '3',
    name: 'Sora',
    link: 'https://openai.com/sora',
    description: 'An AI model that can create realistic and imaginative scenes from text instructions.',
    keywords: ['video generation', 'openai', 'text-to-video'],
    imageBase64: 'https://picsum.photos/seed/sora/400/300',
    status: ApprovalStatus.Approved,
    submittedBy: 'user@example.com',
  },
  {
    id: '4',
    name: 'Code Helper',
    link: 'https://example.com/codehelper',
    description: 'A new AI assistant for writing and debugging code faster. Helps with boilerplate and complex algorithms.',
    keywords: ['code', 'developer', 'assistant', 'productivity'],
    imageBase64: 'https://picsum.photos/seed/code/400/300',
    status: ApprovalStatus.Pending,
    submittedBy: 'developer@example.com',
  }
];
