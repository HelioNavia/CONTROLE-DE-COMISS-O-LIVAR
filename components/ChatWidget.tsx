import React, { useState, useRef, useEffect } from 'react';
import { Sale, ChatMessage } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { ChatIcon, SendIcon, CloseIcon, BotIcon, UserIcon } from './icons';

interface ChatWidgetProps {
  salesData: Sale[];
}

const suggestedQuestions = [
    "Qual a construtora com mais vendas?",
    "Resuma o desempenho geral.",
    "Quem possui comissões pendentes?",
    "Qual foi a maior venda registrada?",
];

const ChatWidget: React.FC<ChatWidgetProps> = ({ salesData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
        const saved = localStorage.getItem('comissio-chat-history');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to load chat history:", error);
    }
    return [{
        id: 'initial',
        sender: 'bot',
        text: 'Olá! Eu sou o ComissioBot. Como posso ajudar com seus dados de vendas hoje?',
    }];
  });

  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
        localStorage.setItem('comissio-chat-history', JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save chat history:", error);
    }
  }, [messages]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (messageOverride?: string) => {
    const message = (messageOverride || userInput).trim();
    if (!message) return;
    
    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);
    if (!messageOverride) {
        setUserInput('');
    }
    setIsLoading(true);

    try {
        const botResponse = await generateChatResponse(message, salesData);
        setMessages(prev => [...prev, botResponse]);
    } catch (error) {
        console.error("Error fetching chat response:", error);
        const errorResponse: ChatMessage = {
            id: 'error-' + Date.now().toString(),
            sender: 'bot',
            text: 'Desculpe, ocorreu um erro ao me conectar com a IA. Por favor, tente novamente.'
        };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform transform hover:scale-110 z-50"
        aria-label="Abrir chat"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 ease-out origin-bottom-right transform scale-100 opacity-100">
          <header className="bg-indigo-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <h3 className="font-bold text-lg">ComissioBot</h3>
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500 text-white"><BotIcon/></span>}
                <div className={`rounded-2xl px-4 py-2 max-w-xs md:max-w-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 border-t border-gray-300 dark:border-gray-600 pt-2">
                          <p className="text-xs font-bold mb-1">Fontes:</p>
                          <ul className="space-y-1">
                              {msg.sources.map((source, index) => (
                                  <li key={index}>
                                      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline truncate block">
                                          {source.title || source.uri}
                                      </a>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
                </div>
                {msg.sender === 'user' && <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white"><UserIcon/></span>}
              </div>
            ))}
            {isLoading && (
                 <div className="flex items-end gap-2 justify-start">
                    <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500 text-white"><BotIcon/></span>
                    <div className="rounded-2xl px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                        <div className="flex items-center justify-center space-x-1">
                            <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                            <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                            <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {messages.length < 2 && (
             <div className="px-4 pb-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Ou tente uma sugestão:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(q)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
          )}

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Digite sua pergunta..."
                className="flex-1 bg-transparent p-3 focus:outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500"
                disabled={isLoading}
              />
              <button onClick={() => handleSendMessage()} disabled={isLoading || !userInput.trim()} className="p-3 text-indigo-500 hover:text-indigo-600 disabled:text-gray-400 disabled:cursor-not-allowed">
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
