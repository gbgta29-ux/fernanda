
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";
import { Check, CheckCheck } from 'lucide-react';
import Image from "next/image";
import AudioPlayer from "./audio-player";

interface ChatMessageProps {
  message: Message;
}

const MessageStatus = ({ status }: { status: Message['status'] }) => {
  if (status === 'sent') {
    return <Check className="h-4 w-4 ml-1 text-muted-foreground" aria-label="Sent" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 ml-1 text-muted-foreground" aria-label="Delivered" />;
  }
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 ml-1 text-sky-500" aria-label="Read" />;
  }
  return null;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';

  const renderContent = () => {
    switch (message.type) {
      case 'audio':
        return (
          <div className="flex items-center gap-2.5">
            <Image
                src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/perfil.jpg"
                data-ai-hint="woman profile"
                alt="Valesca Carvalho"
                width={40}
                height={40}
                className="shrink-0 rounded-full"
            />
            <div className="w-[240px] sm:w-[270px]">
              <AudioPlayer src={message.url!} />
            </div>
          </div>
        );
      case 'image':
        return (
            <Image
              src={message.url!}
              alt="Imagem de boas-vindas"
              width={300}
              height={300}
              className="rounded-md object-cover"
              data-ai-hint="welcome sign"
            />
        );
      case 'text':
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>;
    }
  };

  return (
    <div className={cn("flex mb-2", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "rounded-lg shadow",
        isUser ? "bg-whatsapp-user-message" : "bg-white",
        message.type === 'image' ? 'p-1' :
        message.type === 'audio' ? 'py-2.5 px-3' :
        'p-2',
        "max-w-[85%] md:max-w-[75%]"
      )}>
        {renderContent()}
        <div className="flex justify-end items-center mt-1 px-2 pb-1">
          <span className="text-xs text-muted-foreground mr-1">{message.timestamp}</span>
          {isUser && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}
