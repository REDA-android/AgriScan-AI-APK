import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Trash2 } from 'lucide-react';
import { chatWithGemini } from '../services/geminiService';
import { ConfirmDialog } from './ConfirmDialog';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'model' | 'user'; text: string }[]>([
    { role: 'model', text: 'Bonjour ! Je suis l\'assistant AgroScan IA. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const reply = await chatWithGemini(userMessage, messages);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: e.message || 'Désolé, une erreur est survenue.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{ role: 'model', text: 'Bonjour ! Je suis l\'assistant AgroScan IA. Comment puis-je vous aider aujourd\'hui ?' }]);
    setShowClearConfirm(false);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Effacer la conversation"
        message="Êtes-vous sûr de vouloir effacer tout l'historique de cette conversation ? Cette action est irréversible."
        confirmText="Effacer"
        onConfirm={handleClearChat}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 md:right-6 md:bottom-24 w-14 h-14 bg-emerald-500/20 backdrop-blur-2xl border border-emerald-400/40 rounded-full flex items-center justify-center text-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 z-[90] ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Ouvrir le ChatBot"
      >
        <MessageSquare size={24} className="fill-current drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      </button>

      {/* Chat Window - Liquid Glass Container */}
      <div 
        className={`fixed inset-0 md:inset-auto md:bottom-6 md:right-6 w-full md:w-[400px] h-[100dvh] md:h-[600px] bg-white/10 dark:bg-black/40 backdrop-blur-3xl webkit-backdrop-blur-xl md:rounded-[32px] border-0 md:border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] flex flex-col transition-all duration-300 origin-bottom-right z-[4000] overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-white/5 p-4 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-white font-black text-sm tracking-tight">AgroScan Assistant</h3>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> IA Connectée
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Effacer l'historique"
              aria-label="Effacer l'historique"
            >
              <Trash2 size={16} />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Fermer le ChatBot"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-medium ${msg.role === 'user' ? 'bg-emerald-500/25 border border-emerald-400/30 text-white rounded-br-xs shadow-[0_4px_20px_rgba(16,185,129,0.2)]' : 'bg-white/10 text-slate-200 rounded-bl-xs border border-white/15 backdrop-blur-md shadow-md'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-xs p-4 bg-white/10 border border-white/15 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white/5 border-t border-white/10 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez une question agronomique..."
              className="w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 w-8 h-8 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 hover:bg-emerald-500/50 transition-colors disabled:opacity-40 disabled:hover:bg-emerald-500/30"
              aria-label="Envoyer le message"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
