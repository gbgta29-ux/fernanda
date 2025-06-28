
'use client'

import { useEffect, useRef } from 'react';
import type { Message } from '@/types/message';
import ChatMessage from './chat-message';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  autoPlayingAudioId?: number | null;
}

export default function ChatMessages({ messages, isLoading, autoPlayingAudioId }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  return (
    <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1" />
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} isAutoPlaying={msg.id === autoPlayingAudioId} />)}
        {isLoading && (
            <div className="flex justify-start mb-2">
            <div className="rounded-lg p-2 px-4 max-w-sm bg-white text-black shadow-sm flex items-end">
                <span className="text-sm italic text-muted-foreground">Digitando...</span>
            </div>
            </div>
        )}
        <div ref={scrollRef} />
    </div>
  );
}
