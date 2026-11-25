import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  X, Minus, Maximize2, Minimize2, Send, Search, Scale, PackageSearch, Tag, Plus, ChevronRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = 'assistant' | 'user';

interface Message {
  id: string;
  role: Role;
  text: string;
  ts: Date;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  desc: string;
  prompt: string;
  color: string;
  iconBg: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Search size={18} />,
    label: 'Find the right product',
    desc: "Tell me what you need, I'll recommend the best options",
    prompt: "Help me find the right product",
    color: 'text-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-500/15',
  },
  {
    icon: <Scale size={18} />,
    label: 'Compare products',
    desc: 'Compare features, price and value',
    prompt: "I'd like to compare some products",
    color: 'text-indigo-600',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/15',
  },
  {
    icon: <PackageSearch size={18} />,
    label: 'Track my order',
    desc: 'Check order status, return or cancellation',
    prompt: 'I want to track or manage my order',
    color: 'text-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-500/15',
  },
  {
    icon: <Tag size={18} />,
    label: 'Get personalized deals',
    desc: 'Deals based on your interests and browsing',
    prompt: 'Show me personalized deals for me',
    color: 'text-purple-600',
    iconBg: 'bg-purple-50 dark:bg-purple-500/15',
  },
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm your AI Shopping Assistant 👋\nFind products, compare options, track orders, and get personalized recommendations.",
  ts: new Date(),
};

// Simulated AI responses (pure frontend — no backend changes)
function simulateResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('find') || p.includes('recommend') || p.includes('suggest'))
    return "Sure! Tell me more about what you're looking for — category, budget, or any specific features? I'll find the best options for you! 🛍️";
  if (p.includes('compare'))
    return "Great choice to compare before buying! Share the product names or categories you want to compare and I'll break down the features, prices, and value. ⚖️";
  if (p.includes('track') || p.includes('order') || p.includes('status'))
    return "To track your order, head to **My Orders** in your account. Need help with a return or cancellation? Just let me know your order details! 📦";
  if (p.includes('deal') || p.includes('offer') || p.includes('discount'))
    return "Here are today's hottest picks for you: 🔥\n• Electronics — up to 75% off\n• Fashion — up to 50% off\n• Flash Deals — 50% off everything!\n\nShall I guide you to any of these?";
  if (p.includes('hello') || p.includes('hi') || p.includes('hey'))
    return "Hello! Great to have you here 😊 I can help you find products, compare options, track orders, or discover deals. What can I do for you today?";
  return "I'd love to help with that! 😊 Could you give me a bit more detail so I can point you in the right direction? For example, tell me what product you need or what problem you're trying to solve.";
}

// ─── Floating Robot Button ────────────────────────────────────────────────────

interface FloatingRobotProps {
  onClick: () => void;
}

function FloatingRobot({ onClick }: FloatingRobotProps) {
  return (
    <>
      <style>{`
        @keyframes ai-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25%       { transform: translateY(-6px) rotate(-1.5deg); }
          75%       { transform: translateY(-3px) rotate(1deg); }
        }
        @keyframes ai-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        @keyframes ai-glow {
          0%, 100% { box-shadow: 0 0 20px 5px rgba(99,102,241,0.35), 0 6px 28px rgba(59,130,246,0.25), 0 2px 12px rgba(255,255,255,0.8); }
          50%       { box-shadow: 0 0 32px 9px rgba(99,102,241,0.55), 0 10px 36px rgba(59,130,246,0.4),  0 2px 16px rgba(255,255,255,0.9); }
        }
        @keyframes ai-badge-pop {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.2); }
        }
        .ai-robot-float   { animation: ai-float 3.5s ease-in-out infinite; }
        .ai-robot-glow    { animation: ai-glow  2.5s ease-in-out infinite; }
        .ai-pulse-ring    { animation: ai-pulse-ring 2s ease-out infinite; }
        .ai-badge-pop     { animation: ai-badge-pop 2s ease-in-out infinite; }
        .ai-widget-enter  {
          animation: ai-widget-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        @keyframes ai-widget-in {
          from { opacity:0; transform: scale(0.85) translateY(20px); transform-origin: bottom right; }
          to   { opacity:1; transform: scale(1)    translateY(0);    transform-origin: bottom right; }
        }
        .ai-widget-exit {
          animation: ai-widget-out 0.2s ease-in forwards;
        }
        @keyframes ai-widget-out {
          from { opacity:1; transform: scale(1)    translateY(0);    transform-origin: bottom right; }
          to   { opacity:0; transform: scale(0.85) translateY(20px); transform-origin: bottom right; }
        }
        .ai-msg-enter {
          animation: ai-msg-in 0.25s ease-out forwards;
        }
        @keyframes ai-msg-in {
          from { opacity:0; transform: translateY(8px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .ai-typing span {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #93c5fd;
          margin: 0 1.5px;
          animation: ai-typing-dot 1.2s ease-in-out infinite;
        }
        .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes ai-typing-dot {
          0%, 60%, 100% { transform: translateY(0);    opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1;   }
        }
      `}</style>

      <button
        onClick={onClick}
        aria-label="Open AI Shopping Assistant"
        className="ai-robot-glow relative flex items-center justify-center w-[80px] h-[80px] rounded-full bg-white cursor-pointer border-[3px] border-indigo-200 hover:scale-105 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 shadow-2xl"
      >
        {/* Pulse rings */}
        <span className="ai-pulse-ring absolute inset-0 rounded-full border-2 border-indigo-400/60 pointer-events-none" />
        <span
          className="ai-pulse-ring absolute inset-0 rounded-full border-2 border-purple-400/40 pointer-events-none"
          style={{ animationDelay: '0.7s' }}
        />

        {/* Exact photo logo — fills the circle cleanly */}
        <div className="w-full h-full rounded-full overflow-hidden">
          <img
            src="/ai-chatbot.jpg"
            alt="AI Shopping Assistant"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Online badge */}
        <span className="ai-badge-pop absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow-lg z-10" aria-label="Online">
          <span className="block h-2 w-2 rounded-full bg-white" />
        </span>
      </button>
    </>
  );
}

// ─── Chat Widget ──────────────────────────────────────────────────────────────

interface ChatWidgetProps {
  onMinimize: () => void;
  onClose: () => void;
  visible: boolean;
}

function ChatWidget({ onMinimize, onClose, visible }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // focus input when widget opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 320);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setIsMaximized(false);
      onClose();
    }, 180);
  }, [onClose]);

  const handleMinimize = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setIsMaximized(false);
      onMinimize();
    }, 180);
  }, [onMinimize]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate network latency
    const delay = 900 + Math.random() * 600;
    await new Promise(r => setTimeout(r, delay));

    const aiText = simulateResponse(text);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: aiText, ts: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setTyping(false);
  }, []);

  const handleQuickAction = (action: QuickAction) => sendMessage(action.prompt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const showWelcomeActions = messages.length === 1; // only welcome message shown

  return (
    <div
      role="dialog"
      aria-label="AI Shopping Assistant"
      aria-modal="true"
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 transition-all duration-300 ease-in-out',
        isMaximized
          ? 'w-[min(720px,calc(100vw-24px))] h-[min(800px,calc(100vh-48px))]'
          : 'w-[min(380px,calc(100vw-24px))] h-[min(600px,calc(100vh-120px))]',
        'bg-white dark:bg-gray-900',
        exiting ? 'ai-widget-exit' : 'ai-widget-enter',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shrink-0">
        {/* Robot avatar in header */}
        <div className="relative shrink-0 w-11 h-11 rounded-full border-2 border-white/60 shadow-md overflow-hidden bg-white">
          <img
            src="/ai-chatbot.jpg"
            alt="AI Shopping Assistant"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">AI Shopping Assistant</p>
          <p className="text-xs text-emerald-300 font-medium flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Online
          </p>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleMinimize}
            aria-label="Minimize"
            title="Minimize"
            className="h-7 w-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => setIsMaximized(prev => !prev)}
            aria-label={isMaximized ? "Restore size" : "Maximize"}
            title={isMaximized ? "Restore size" : "Maximize"}
            className="h-7 w-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={handleClose}
            aria-label="Close"
            title="Close"
            className="h-7 w-7 rounded-full bg-white/15 hover:bg-red-400/80 flex items-center justify-center transition-colors text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Welcome hero (shown when only welcome message exists) ── */}
      {showWelcomeActions && (
        <div className="shrink-0 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-gray-900 px-5 pt-5 pb-4 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-800">
          {/* Large robot photo — displayed in a generous circle with a soft glow ring */}
          <div className="mb-3 relative">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-indigo-100 dark:ring-indigo-500/20">
              <img
                src="/ai-chatbot.jpg"
                alt="AI Shopping Assistant"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            {/* online indicator on the hero image */}
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white shadow" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
            Hi! I'm your AI Shopping Assistant 👋
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[260px] leading-relaxed">
            Find products, compare options, track orders, and get personalized recommendations.
          </p>
        </div>
      )}

      {/* ── Messages / Quick actions ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
        {/* Quick actions (only shown before first user message) */}
        {showWelcomeActions && (
          <div className={cn("space-y-2 pb-1", isMaximized && "grid grid-cols-1 sm:grid-cols-2 gap-2.5 space-y-0")}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10 transition-all duration-200 group text-left"
              >
                <span className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', action.iconBg, action.color)}>
                  {action.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">{action.label}</span>
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{action.desc}</span>
                </span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Messages (shown after first interaction) */}
        {!showWelcomeActions && messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2 ai-msg-enter',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
            )}
          >
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div className="shrink-0 w-7 h-7 rounded-full border border-indigo-100 dark:border-indigo-700 shadow-sm self-end mb-0.5 overflow-hidden bg-white">
                <img src="/ai-chatbot.jpg" alt="" className="w-full h-full object-cover" draggable={false} />
              </div>
            )}
            {msg.role === 'user' && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center self-end mb-0.5">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">You</span>
              </div>
            )}

            {/* Bubble */}
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm',
              )}
            >
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-2 ai-msg-enter">
            <div className="shrink-0 w-7 h-7 rounded-full border border-indigo-100 dark:border-indigo-700 shadow-sm self-end mb-0.5 overflow-hidden bg-white">
              <img src="/ai-chatbot.jpg" alt="" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="ai-typing flex items-center h-4">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 px-3 py-3 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Attachment placeholder (decorative) */}
          <button
            type="button"
            aria-label="Attach"
            className="shrink-0 h-9 w-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-300 transition-colors"
          >
            <Plus size={16} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about shopping..."
            className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-300 transition-all"
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={!input.trim() || typing}
            aria-label="Send"
            className="shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Exported Component ──────────────────────────────────────────────────

export type WidgetState = 'robot' | 'open' | 'minimized';

export default function AiShoppingAssistant() {
  const [state, setState] = useState<WidgetState>('robot');

  const openWidget = useCallback(() => setState('open'), []);
  const minimizeWidget = useCallback(() => setState('minimized'), []);
  const closeWidget = useCallback(() => setState('robot'), []);

  return (
    // Fixed container: bottom-right corner, above all page content
    <div
      className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-3 pointer-events-none"
      aria-live="polite"
    >
      {/* Chat widget — rendered only when open or minimized */}
      {(state === 'open') && (
        <div className="pointer-events-auto">
          <ChatWidget
            visible={state === 'open'}
            onMinimize={minimizeWidget}
            onClose={closeWidget}
          />
        </div>
      )}

      {/* Floating robot — shown when widget is closed OR minimized */}
      <div className="pointer-events-auto">
        {state !== 'open' ? (
          <div
            onClick={openWidget}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openWidget();
              }
            }}
            className="ai-robot-float flex flex-col items-center gap-1.5 cursor-pointer group focus:outline-none"
            aria-label="Open AI Shopping Assistant"
          >
            {/* AI Assistant floating text badge above the logo by default */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg shadow-indigo-500/25 border border-white/30 tracking-wide select-none group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-200">
              AI Assistant
            </div>
            <FloatingRobot onClick={openWidget} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
