
import React, { useState, useRef, useEffect } from 'react';
import { HorseLot, ChatMessage } from '../types';
import { askGeminiAboutHorse } from '../services/geminiService';

interface Props {
  horse: HorseLot;
}

const GeminiConsultant: React.FC<Props> = ({ horse }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Sou o Horse Bid Market Specialist , como posso ajudar?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await askGeminiAboutHorse(horse, userMsg.text);

    const aiMsg: ChatMessage = { role: 'model', text: responseText };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  // Markdown Parser
  const renderMessageText = (text: string) => {
      const paragraphs = text.split('\n');
      return paragraphs.map((line, idx) => {
          // Handle Bullet Points
          if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('* ')) {
              const cleanLine = line.replace(/^[-•*]\s*/, '');
              // Check for bold within list item
              const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
              return (
                  <li key={idx} className="ml-4 list-disc marker:text-equus-gold mb-1">
                      {parts.map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={i} className="font-bold text-equus-navy">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                      })}
                  </li>
              );
          }
          
          // Handle Headers / Bold Lines
          if (line.includes('**')) {
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                  <p key={idx} className="mb-2 text-gray-800">
                      {parts.map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={i} className="font-bold text-equus-navy block mt-3 mb-1 uppercase text-xs tracking-wider">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                      })}
                  </p>
              );
          }

          // Empty lines
          if (!line.trim()) {
              return <div key={idx} className="h-2"></div>;
          }

          // Standard Paragraph
          return <p key={idx} className="mb-2 leading-relaxed text-gray-700">{line}</p>;
      });
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-gray-200 rounded-sm shadow-sm">
      <div className="bg-equus-navy text-white p-3 flex justify-between items-center">
        <h3 className="font-serif font-bold text-sm tracking-widest uppercase flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
             <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
             <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
            HORSE BID MARKET SPECIALIST (IA)
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 text-sm rounded-lg ${
              msg.role === 'user' 
                ? 'bg-equus-gold text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
               {msg.role === 'user' ? msg.text : renderMessageText(msg.text)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              <span className="text-xs text-gray-500 font-bold ml-2">PENSANDO NA SUA PERGUNTA...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ex: consulte minha genealogia completa no site Hippomundo"
          className="flex-1 bg-white text-black border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-equus-gold placeholder-gray-400"
          disabled={loading}
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="bg-equus-navy text-white px-4 py-2 rounded text-sm hover:bg-opacity-90 transition-colors disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default GeminiConsultant;
