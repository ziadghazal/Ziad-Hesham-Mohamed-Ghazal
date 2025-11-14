
import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
}

const ACCEPTED_FILES = "image/*,application/pdf,.txt,.csv";

// Client-side validation function to check if the file type is allowed.
const isValidFile = (file: File): boolean => {
    const acceptedTypes = ACCEPTED_FILES.split(',').map(t => t.trim());
    const fileMimeType = file.type;
    const fileName = file.name.toLowerCase();

    return acceptedTypes.some(type => {
        // Check for wildcard types like 'image/*'
        if (type.endsWith('/*')) {
            return fileMimeType.startsWith(type.slice(0, -1));
        }
        // Check for extension types like '.txt'
        if (type.startsWith('.')) {
            return fileName.endsWith(type);
        }
        // Check for full MIME types
        return fileMimeType === type;
    });
};


// Fix: Add types for Web Speech API to resolve 'SpeechRecognition' not found errors.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// Extend window type for SpeechRecognition
interface IWindow extends Window {
  SpeechRecognition: SpeechRecognitionStatic;
  webkitSpeechRecognition: SpeechRecognitionStatic;
}

const FileIcon = ({ type }: { type: string }) => {
    // PDF
    if (type === 'application/pdf') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.414a1 1 0 00-.293-.707l-4.414-4.414A1 1 0 0011.586 3H4zm3 0a1 1 0 000 2h3a1 1 0 000-2H7zM4 16v-1h12v1a1 1 0 01-1 1H5a1 1 0 01-1-1zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
        );
    }
    
    // CSV
    if (type === 'text/csv') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 4v16" />
            </svg>
        );
    }

    // Text file
    if (type.startsWith('text/')) {
        return (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    }

    // Generic file
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm2 2a1 1 0 00-1 1v1a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1H6z" clipRule="evenodd" />
        </svg>
    );
};


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;
    if(SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!isValidFile(selectedFile)) {
        alert(`Invalid file type. Please select an image, PDF, TXT, or CSV file.`);
        // Reset the input so the same invalid file can be detected again if re-selected
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Clean up previous preview
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const removeFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFile(null);
    setFilePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || file) && !isLoading) {
      if(isListening) {
        recognitionRef.current?.stop();
      }
      onSendMessage(input.trim(), file);
      setInput('');
      removeFile();
    }
  };

  const renderFilePreview = () => {
    if (!file || !filePreview) return null;

    const isImage = file.type.startsWith('image/');

    return (
      <div className="relative inline-flex items-center gap-2 mb-2 p-2 bg-slate-700/80 rounded-lg border border-slate-600/50">
        {isImage ? (
          <img src={filePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
        ) : (
          <div className="flex items-center gap-3 p-2">
            <FileIcon type={file.type} />
            <span className="text-sm text-slate-200 font-medium truncate max-w-[200px]">{file.name}</span>
          </div>
        )}
        <button
          onClick={removeFile}
          className="absolute -top-2 -right-2 bg-slate-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold focus:outline-none hover:bg-red-500 transition-colors"
          aria-label="Remove file"
        >
          &times;
        </button>
      </div>
    );
};

  const canSendMessage = !isLoading && (!!input.trim() || !!file);
  const placeholderText = isListening ? 'Listening...' : (isLoading ? 'ZIAD.AI is thinking...' : 'Ask a question or add a file (CSV, PDF, TXT, image)...');

  return (
    <div className="bg-slate-800 p-4 border-t border-slate-700">
      {renderFilePreview()}
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={ACCEPTED_FILES}
            aria-label="Add file"
        />
        <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
            aria-label="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholderText}
          className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200 disabled:opacity-50"
          disabled={isLoading}
          aria-label="Chat input"
        />
        {isSpeechSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isLoading}
            className={`p-3 rounded-full hover:bg-slate-700 disabled:opacity-50 transition-colors ${isListening ? 'text-red-500 animate-pulse bg-slate-700' : 'text-slate-400 hover:text-white'}`}
            aria-label={isListening ? 'Stop listening' : 'Start dictation'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-14 0m7 10v4m0 0l-4-4m4 4l4-4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3a1 1 0 011-1h12a1 1 0 011 1v4a7 7 0 01-14 0V3z" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          disabled={!canSendMessage}
          className="bg-sky-600 text-white rounded-full p-3 hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
          aria-label="Send message"
        >
          {isLoading ? (
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
