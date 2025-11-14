
import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { startChat } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import type { ChatMessage as ChatMessageType } from './types';

const TypingIndicator = () => (
  <div className="flex items-start gap-3 my-4 justify-start">
    <div className="w-8 h-8 rounded-full bg-sky-500 flex-shrink-0 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4z" />
      </svg>
    </div>
    <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-slate-700 text-slate-200 rounded-tl-none">
      <div className="flex items-center justify-center space-x-1">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  </div>
);

const fileToGenerativePart = (file: File) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error("Failed to read file as data URL."));
            }
            resolve({
                inlineData: {
                    data: reader.result.split(',')[1],
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = () => reject(new Error("Error reading file."));
        reader.readAsDataURL(file);
    });
};

const fileToTextPart = (file: File) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error("Failed to read file as text."));
            }
            resolve({
                text: `\n\n--- DATA FROM ${file.name} ---\n${reader.result}`
            });
        };
        reader.onerror = () => reject(new Error("Error reading file."));
        reader.readAsText(file);
    });
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChat = () => {
      const session = startChat();
      setChatSession(session);
      const initialMessageText = "Hello! I'm ZIAD.AI, your intelligent AI assistant. Feel free to ask me anything or upload a file (like a CSV) for analysis!";
      setMessages([{
        id: crypto.randomUUID(),
        text: initialMessageText,
        sender: 'bot'
      }]);
      setIsLoading(false);
    };

    initializeChat();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText: string, file?: File) => {
    if (!chatSession) return;

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      text: messageText,
      sender: 'user',
      file: file ? {
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      } : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let response;
      if (file) {
        const isTextFile = file.type === 'text/csv' || file.type.startsWith('text/');
        
        if (isTextFile) {
            const fileTextPart: any = await fileToTextPart(file);
            const combinedMessage = messageText + fileTextPart.text;
            response = await chatSession.sendMessage({ message: combinedMessage });
        } else {
            const filePart = await fileToGenerativePart(file);
            const textPart = { text: messageText };
            const parts = [];
            if(messageText) parts.push(textPart);
            parts.push(filePart);
            response = await chatSession.sendMessage({ message: parts });
        }
      } else {
        response = await chatSession.sendMessage({ message: messageText });
      }

      const botResponseText = response.text;
      let chartSpec: object | undefined = undefined;
      let messageTextForDisplay = botResponseText;

      const vegaLiteRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = botResponseText.match(vegaLiteRegex);

      if (match && match[1]) {
        try {
          chartSpec = JSON.parse(match[1]);
          messageTextForDisplay = botResponseText.replace(vegaLiteRegex, '').trim();
        } catch (e) {
          console.warn("Failed to parse chart JSON from bot response:", e);
        }
      }

      const botMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        text: messageTextForDisplay,
        sender: 'bot',
        chartSpec,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      let friendlyErrorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof Error) {
          if (error.message.includes('Unsupported MIME type')) {
              friendlyErrorMessage = "Sorry, that file type isn't supported. Please upload an image, PDF, CSV, or TXT file.";
          } else if (error.message.includes('400')) {
               friendlyErrorMessage = "There was an issue with the request. Please check your file or message and try again.";
          } else if (error.message.includes('500') || error.message.toLowerCase().includes('network')) {
               friendlyErrorMessage = "I'm experiencing some technical difficulties. Please try again in a few moments.";
          } else if (error.message.includes('reading file')) {
              friendlyErrorMessage = "There was a problem reading your file. Please ensure it's not corrupted and try again."
          }
      }

      const errorMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        text: friendlyErrorMessage,
        sender: 'bot',
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Revoke object URL to avoid memory leaks
      if (userMessage.file) {
        URL.revokeObjectURL(userMessage.file.url);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen p-4">
      <div className="w-full max-w-2xl h-full md:h-[90vh] bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col border border-slate-700 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;