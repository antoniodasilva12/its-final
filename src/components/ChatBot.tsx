import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { generateChatResponse } from '../services/chatbotAI';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Chatbase
    if (!(window as any).chatbase || (window as any).chatbase("getState") !== "initialized") {
      (window as any).chatbase = (...args: any[]) => {
        if (!(window as any).chatbase?.q) {
          ((window as any).chatbase).q = [];
        }
((window as any).chatbase.q).push(...args);
      };
      (window as any).chatbase = new Proxy((window as any).chatbase, {
        get(target, prop) {
          if (prop === "q") {
            return target.q;
          }
          return (...args: unknown[]) => target(prop, ...args);
        }
      });

      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = "sP9CJWhwzez2Ue0OjChkF";
      script.setAttribute('data-domain', 'www.chatbase.co');
      document.body.appendChild(script);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await generateChatResponse(userMessage);
      return response;
    } catch (error) {
      console.error('Error getting bot response:', error);
      return 'I apologize, but I am having trouble processing your request. Please try again later.';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');

    try {
      const botResponse = await getBotResponse(inputMessage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Store the conversation in Supabase
      await supabase.from('chat_messages').insert([
        { message: userMessage.text, is_user: true },
        { message: botMessage.text, is_user: false }
      ]);
    } catch (error) {
      console.error('Error in chat process:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I am having trouble processing your request. Please try again later.',
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  return (
    <div className="fixed bottom-0 left-64 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-t-lg p-4 shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          <FiMessageSquare className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white rounded-t-lg shadow-2xl w-80 h-[calc(100vh-4rem)] flex flex-col transform transition-all duration-300 ease-in-out">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <h3 className="font-semibold text-lg">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/20 rounded-full"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-4">
                <p>Hi! How can I assist you today?</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${message.isUser ? 'text-right' : 'text-left'} animate-fade-in`}
              >
                <div
                  className={`inline-block p-3 rounded-2xl max-w-[80%] ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                      : 'bg-white text-gray-800 shadow-md border border-gray-100'
                  }`}
                >
                  {message.text}
                </div>
                <div className="text-xs text-gray-500 mt-1 px-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t bg-white p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your question..."
                className="flex-1 border rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;