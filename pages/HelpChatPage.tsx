import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon } from '../tools/Icons';
import { generateText } from '../services/geminiService';
import metadata from '../metadata.json';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

const buildSystemPrompt = (): string => {
  const name = metadata?.name || "Naf's AI Hub";
  const description = metadata?.description || '';
  return [
    `You are the helpful live support assistant for ${name}.`,
    'Your goals:',
    '- Read the user message carefully and identify the task or problem.',
    '- Ask for missing details succinctly if required.',
    '- Provide accurate, concise, step-by-step guidance.',
    '- If the question is about a tool/feature, explain where it is in the UI and how to use it.',
    '- If a user reports a bug, gather reproduction steps, expected vs actual behavior, and suggest quick checks.',
    '- Always keep answers aligned with the current theme and UI terminology.',
    '',
    'Context summary:',
    `- App description: ${description}`,
    '- Auth required for tools; users have profile, referrals, badges, usage history.',
    '- Theme colors come from themes.ts (primary, secondary, accent, light).',
    '- Keep responses friendly, direct, and formatted with short paragraphs and lists when helpful.'
  ].join('\n');
};

const HelpChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', text: buildSystemPrompt() }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleMessages = useMemo(() => messages.filter(m => m.role !== 'system'), [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setSending(true);
    try {
      const sys = messages.find(m => m.role === 'system')?.text || buildSystemPrompt();
      const prompt = [sys, '\n\nUser:', text, '\n\nAssistant:'].join(' ');
      const reply = await generateText(prompt);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not reach the assistant. Please try again.' }]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/support')} className="p-2 rounded bg-secondary/40 hover:bg-secondary/60 transition-colors" title="Back">
          <ArrowLeftIcon className="h-5 w-5 text-light" />
        </button>
        <h1 className="text-2xl font-bold text-light flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-accent" /> Live Support Chat
        </h1>
      </div>

      <div className="bg-secondary/20 rounded-lg border border-secondary/40 overflow-hidden">
        <div ref={scrollRef} className="h-[60vh] p-4 space-y-3 overflow-y-auto custom-scrollbar bg-secondary/10">
          {visibleMessages.length === 0 && (
            <div className="text-center text-light/70">Start the conversation by sending a message.</div>
          )}
          {visibleMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${m.role === 'user' ? 'bg-accent text-light' : 'bg-secondary/30 text-light'} max-w-[80%] px-3 py-2 rounded-lg whitespace-pre-wrap`}> 
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 bg-secondary/20 border-t border-secondary/40">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Describe your issue or question..."
            className="flex-1 px-3 py-2 bg-primary border border-secondary/60 rounded-md text-light focus:outline-none focus:ring-accent focus:border-accent"
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-white px-4 py-2 rounded-md transition-colors"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpChatPage;
