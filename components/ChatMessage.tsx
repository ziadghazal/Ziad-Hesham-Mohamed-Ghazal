
import React from 'react';
import { Vega } from 'react-vega';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const BotIcon = () => (
    <div className="w-8 h-8 rounded-full bg-sky-500 flex-shrink-0 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4z" />
        </svg>
    </div>
);

const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    </div>
);

const ErrorIcon = () => (
    <div className="w-8 h-8 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </div>
);

const FileIcon = ({ type }: { type: string }) => {
    // PDF
    if (type === 'application/pdf') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.414a1 1 0 00-.293-.707l-4.414-4.414A1 1 0 0011.586 3H4zm3 0a1 1 0 000 2h3a1 1 0 000-2H7zM4 16v-1h12v1a1 1 0 01-1 1H5a1 1 0 01-1-1zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
        );
    }
    
    // CSV
    if (type === 'text/csv') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 4v16" />
            </svg>
        );
    }

    // Text file
    if (type.startsWith('text/')) {
        return (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    }

    // Generic file
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm2 2a1 1 0 00-1 1v1a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1H6z" clipRule="evenodd" />
        </svg>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  const isError = message.isError;

  const renderFile = () => {
    if (!message.file) return null;

    const isImage = message.file.type.startsWith('image/');

    if (isImage) {
      return (
        <a href={message.file.url} target="_blank" rel="noopener noreferrer">
          <img
            src={message.file.url}
            alt={message.file.name}
            className="rounded-lg mb-2 max-w-full h-auto cursor-pointer"
          />
        </a>
      );
    }

    return (
      <div className="flex items-center gap-3 p-2 rounded-lg mb-2 bg-indigo-500/80 border border-indigo-400/50">
        <FileIcon type={message.file.type} />
        <span className="text-sm text-white font-medium truncate">{message.file.name}</span>
      </div>
    );
  };

  const renderChart = () => {
    if (!message.chartSpec) return null;

    try {
      return (
        <div className="bg-white p-2 rounded-lg mt-2">
          <Vega spec={message.chartSpec} />
        </div>
      );
    } catch (e) {
      console.error("Error rendering Vega chart:", e);
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2" role="alert">
          <strong className="font-bold">Chart Error!</strong>
          <span className="block sm:inline"> Could not render the visualization.</span>
        </div>
      );
    }
  };


  return (
    <div className={`flex items-start gap-3 my-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (isError ? <ErrorIcon /> : <BotIcon />)}
      <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
          isBot 
            ? (isError ? 'bg-red-500/30 border border-red-500/50 text-red-200 rounded-tl-none' : 'bg-slate-700 text-slate-200 rounded-tl-none')
            : 'bg-indigo-600 text-white rounded-br-none'
      }`}>
        {!isBot && renderFile()}
        {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
        {isBot && renderChart()}
      </div>
       {!isBot && <UserIcon />}
    </div>
  );
};

export default ChatMessage;