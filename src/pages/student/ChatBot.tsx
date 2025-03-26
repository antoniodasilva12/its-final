import React, { useState } from 'react';
import { FiMessageSquare } from 'react-icons/fi';

declare global {
  interface Window {
    chatbase: {
      q?: any[];
      (...args: any[]): void;
      (action: string, ...args: any[]): void;
    };
    chatbaseConfig?: {
      chatbotId: string;
      domain: string;
    };
  }
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
        >
          <FiMessageSquare className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96">
          <div id="sP9CJWhwzez2Ue0OjChkF-container" className="w-full h-full"></div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;