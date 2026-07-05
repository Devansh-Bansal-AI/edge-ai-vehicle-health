'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatTerminalProps {
  onSendMessage?: (message: string) => void;
  vehicleId?: string;
}

export function ChatTerminal({ onSendMessage, vehicleId = 'default-vehicle' }: ChatTerminalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = text ?? input.trim();
    if (!message || streaming) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    onSendMessage?.(message);

    // Start streaming response
    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, chatHistory, vehicleId }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: fullText };
                  return updated;
                });
              }
              if (data.error) {
                fullText += `\n\n⚠ Error: ${data.error}`;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: fullText };
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `⚠ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}. Ensure GEMINI_API_KEY is configured.`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#ffffff] rounded-xl border border-rose-100 overflow-hidden" id="chat-terminal">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-rose-100 bg-white">
        <Terminal className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">AI Diagnostic Terminal</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${streaming ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-[10px] text-gray-500">{streaming ? 'Processing...' : 'Ready'}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-3">
            <Terminal className="w-8 h-8" />
            <p className="text-sm text-center">Edge AI Diagnostic System Online</p>
            <p className="text-xs text-center text-gray-300 max-w-md">
              Ask about sensor anomalies, component health, or type a question like &ldquo;Why is my oil pressure dropping?&rdquo;
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                'Run full diagnostics',
                'Why is coolant flow low?',
                'Check engine health',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="text-[10px] px-3 py-1.5 border border-gray-200 rounded-full text-gray-400
                             hover:border-rose-500/30 hover:text-rose-600 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-rose-500/10 border border-rose-500/20 text-gray-900'
                : 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-700 font-mono'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="markdown-response">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  {streaming && i === messages.length - 1 && (
                    <span className="inline-block w-2 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              ) : (
                <pre className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                  {msg.content}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-rose-100 p-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about vehicle diagnostics..."
            disabled={streaming}
            className="flex-1 bg-rose-50/60 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900
                       placeholder:text-gray-300 focus:border-rose-500/30 focus:outline-none
                       disabled:opacity-50 font-mono"
          />
          <button
            onClick={() => handleSend()}
            disabled={streaming || !input.trim()}
            className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-600
                       hover:bg-rose-500/30 disabled:opacity-30 transition-all"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
