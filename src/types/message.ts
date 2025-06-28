
export interface Message {
  id: number;
  type: 'text' | 'audio' | 'image' | 'video' | 'pix';
  text?: string;
  url?: string;
  sender: 'user' | 'bot';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  onEnded?: () => void;
  pixCopyPaste?: string;
}
