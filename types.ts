
export type Sender = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  text: string;
  sender: Sender;
  file?: {
    name: string;
    type: string;
    url: string; // from URL.createObjectURL for preview
  };
  isError?: boolean;
  chartSpec?: object;
}