import { useEffect, useRef, useState } from 'react';
import { KeyRound, Send, Settings, Sparkles, X } from 'lucide-react';
import { PERSONAS, INITIAL_CHAT, SUGGESTED_PROMPTS } from '@/data';
import type { Persona, ChatMessage } from '@/types';

const API_KEY_STORAGE = 'namaa-openai-api-key';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function AlfalfaAvatar({ size = 40, accent = '#105666' }: { size?: number; accent?: string }) {
  return (
    <span className="grid place-items-center rounded-full shrink-0" style={{ width: size, height: size, background: `${accent}18`, border: `1.5px solid ${accent}40` }}>
      <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62} fill="none" aria-hidden="true">
        <path d="M16 28 L16 10" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 22 Q10 20 8 15 Q12 15 16 19M16 22 Q22 20 24 15 Q20 15 16 19M16 17 Q11 15 9 10 Q13 10 16 14M16 17 Q21 15 23 10 Q19 10 16 14M16 12 Q12 10 11 6 Q15 6 16 10M16 12 Q20 10 21 6 Q17 6 16 10" fill={accent} opacity=".82" />
        <circle cx="16" cy="28" r="1.2" fill={accent} />
      </svg>
    </span>
  );
}

function MarkdownText({ text }: { text: string }) {
  const renderInline = (line: string) => line.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>,
  );

  return (
    <div className="space-y-1.5 leading-relaxed">
      {text.split('\n').map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" />;
        const isBullet = /^[-*]\s/.test(trimmed);
        return isBullet
          ? <div key={index} className="flex gap-2"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-moss-400 shrink-0" /><span>{renderInline(trimmed.slice(2))}</span></div>
          : <div key={index}>{renderInline(trimmed)}</div>;
      })}
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [persona, setPersona] = useState<Persona>('ghaith');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem(API_KEY_STORAGE) ?? '');
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const switchPersona = (nextPersona: Persona) => {
    setPersona(nextPersona);
    setMessages([{ id: `switch-${Date.now()}`, persona: nextPersona, role: 'assistant', text: `I'm ${PERSONAS[nextPersona].name} (${PERSONAS[nextPersona].arabic}), your ${PERSONAS[nextPersona].role.toLowerCase()}. How can I help with your field today?`, ts: Date.now() }]);
    setError('');
  };

  const saveApiKey = () => {
    const trimmed = apiKey.trim();
    if (trimmed) localStorage.setItem(API_KEY_STORAGE, trimmed);
    else localStorage.removeItem(API_KEY_STORAGE);
    setApiKey(trimmed);
    setSettingsOpen(false);
    setError('');
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || typing) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, persona, role: 'user', text: content, ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setTyping(true);

    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('The secure chat connection is not available right now.');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/namaa-chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          userApiKey: apiKey || undefined,
          messages: nextMessages.filter((message) => message.role === 'user' || message.role === 'assistant').slice(-40).map(({ role, text }) => ({ role, content: text })),
        }),
      });
      const result = await response.json() as { content?: string; error?: string };
      if (!response.ok || typeof result.content !== 'string') throw new Error(result.error || 'The agronomy assistant could not reply.');
      setMessages((current) => [...current, { id: `a-${Date.now()}`, persona, role: 'assistant', text: result.content as string, ts: Date.now() }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The agronomy assistant could not reply.');
    } finally {
      setTyping(false);
    }
  };

  const p = PERSONAS[persona];

  return (
    <>
      <div id="chat" className="absolute -top-24" />
      <button onClick={() => setOpen((value) => !value)} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-forest-600 text-cream-100 pl-3 pr-5 py-3 shadow-xl shadow-forest-700/30 hover:bg-forest-700 hover:-translate-y-0.5 transition-all" aria-label={open ? 'Close NAMAA AI' : 'Open NAMAA AI'}>
        {open ? <X className="w-5 h-5" /> : <><AlfalfaAvatar size={32} accent="#FAF8F5" /><span className="font-semibold text-sm hidden sm:inline">Ask NAMAA AI</span></>}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[26rem] glass rounded-3xl shadow-2xl shadow-forest-700/30 flex flex-col max-h-[70vh] animate-fade-up overflow-hidden">
          <div className="p-4 border-b border-white/40 flex items-center gap-3 bg-white/30">
            <AlfalfaAvatar size={44} accent={p.accent} />
            <div className="flex-1"><p className="font-display font-semibold text-forest-700 leading-none">{p.name} <span className="text-sm text-forest-700/50 font-arabic">{p.arabic}</span></p><p className="text-[11px] text-forest-700/50 mt-0.5">{p.role}</p></div>
            <button onClick={() => setSettingsOpen((value) => !value)} className="grid place-items-center w-9 h-9 rounded-full bg-white/50 text-forest-700/70 hover:bg-white transition" aria-label="Open chat settings"><Settings className="w-4 h-4" /></button>
            <span className="pill bg-moss-100 text-moss-600"><Sparkles className="w-3 h-3" /> AI</span>
          </div>

          {settingsOpen && (
            <div className="p-4 border-b border-white/40 bg-cream-50/80">
              <div className="flex items-center gap-2 mb-1"><KeyRound className="w-4 h-4 text-forest-600" /><p className="text-sm font-semibold text-forest-700">OpenAI key</p></div>
              <p className="text-[11px] text-forest-700/55 mb-3">Optional. Leave empty to use NAMAA's secure platform connection. Your personal key stays in this browser and is sent only for your chat request.</p>
              <div className="flex gap-2"><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-..." className="min-w-0 flex-1 bg-white/70 rounded-xl px-3 py-2 text-xs text-forest-700 outline-none focus:bg-white" /><button onClick={saveApiKey} className="rounded-xl bg-forest-600 text-cream-100 px-3 py-2 text-xs font-semibold hover:bg-forest-700">Save</button></div>
            </div>
          )}

          <div className="px-4 py-2.5 flex gap-2 bg-white/20">
            {(Object.keys(PERSONAS) as Persona[]).map((key) => <button key={key} onClick={() => switchPersona(key)} className={`flex-1 rounded-full py-2 text-xs font-semibold transition-all ${key === persona ? 'bg-forest-600 text-cream-100 shadow' : 'bg-white/40 text-forest-700/60 hover:bg-white/60'}`}>{PERSONAS[key].name} · <span className="font-arabic">{PERSONAS[key].arabic}</span></button>)}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[18rem]">
            {messages.map((message) => <div key={message.id} className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {message.role === 'assistant' && <AlfalfaAvatar size={30} accent={PERSONAS[message.persona].accent} />}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${message.role === 'user' ? 'bg-forest-600 text-cream-100 rounded-tr-sm' : 'bg-white/70 text-forest-700 rounded-tl-sm border border-white/60'}`}><MarkdownText text={message.text} /></div>
            </div>)}
            {typing && <div className="flex gap-2.5"><AlfalfaAvatar size={30} accent={p.accent} /><div className="bg-white/70 rounded-2xl rounded-tl-sm border border-white/60 px-4 py-3 flex gap-1">{[0, 1, 2].map((index) => <span key={index} className="w-1.5 h-1.5 rounded-full bg-forest-700/40 animate-bounce" style={{ animationDelay: `${index * 150}ms` }} />)}</div></div>}
            {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-500">{error}</div>}
          </div>

          {messages.length <= 2 && <div className="px-4 pb-2 flex flex-wrap gap-1.5">{SUGGESTED_PROMPTS[persona].map((prompt) => <button key={prompt} onClick={() => void send(prompt)} className="text-[11px] rounded-full bg-moss-50 border border-moss-200 text-moss-600 px-2.5 py-1 hover:bg-moss-100 transition">{prompt}</button>)}</div>}
          <div className="p-3 border-t border-white/40 bg-white/30 flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} placeholder={`Ask ${p.name}...`} className="flex-1 bg-white/60 rounded-full px-4 py-2.5 text-sm text-forest-700 placeholder:text-forest-700/40 outline-none focus:bg-white/90 transition" /><button onClick={() => void send()} disabled={typing} className="grid place-items-center w-10 h-10 rounded-full bg-forest-600 text-cream-100 hover:bg-forest-700 disabled:opacity-50 transition" aria-label="Send message"><Send className="w-4 h-4" /></button></div>
        </div>
      )}
    </>
  );
}
