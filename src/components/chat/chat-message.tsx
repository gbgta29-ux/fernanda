
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";
import { Check, CheckCheck, Copy } from 'lucide-react';
import Image from "next/image";
import AudioPlayer from "./audio-player";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: Message;
  isAutoPlaying?: boolean;
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

export default function ChatMessage({ message, isAutoPlaying = false }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const { toast } = useToast();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código PIX copiado!",
      description: "Agora é só colar no seu aplicativo do banco.",
    });
  };

  const TimeAndStatus = () => (
    <div className="flex justify-end items-center">
      <span className="text-xs text-muted-foreground mr-1">{message.timestamp}</span>
      {isUser && <MessageStatus status={message.status} />}
    </div>
  )

  const OverlayTimeAndStatus = () => (
     <div className="absolute bottom-1.5 right-1.5 bg-black/50 rounded-md px-1 py-0.5 flex items-center z-10">
        <span className="text-xs text-white/90 mr-1">{message.timestamp}</span>
        {isUser && <MessageStatus status={message.status} />}
      </div>
  )

  const renderContent = () => {
    switch (message.type) {
      case 'pix':
        if (!message.pixCopyPaste) return null;
        return (
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-sm">PIX Copia e Cola</p>
              <p className="text-xs text-muted-foreground">Clique no botão para copiar o código.</p>
            </div>
            <div className="w-full space-y-2">
                <p className="bg-muted w-full text-xs text-left font-mono p-2 rounded-md break-all">{message.pixCopyPaste}</p>
                <Button onClick={() => handleCopyCode(message.pixCopyPaste!)} variant="outline" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código
                </Button>
            </div>
            <div className="mt-1 -mb-1"><TimeAndStatus /></div>
          </div>
        );
      case 'audio':
        return (
          <>
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
                <AudioPlayer src={message.url!} autoplay={isAutoPlaying} onEnded={message.onEnded} />
              </div>
            </div>
            <div className="mt-1 pr-1"><TimeAndStatus /></div>
          </>
        );
      case 'image':
        return (
          <div className="relative">
            <Image
              src={message.url!}
              alt="Imagem enviada"
              width={300}
              height={300}
              className="rounded-md object-cover"
              data-ai-hint="sent image"
            />
            <OverlayTimeAndStatus />
          </div>
        );
      case 'video':
        return (
          <div className="relative">
            <video
              src={message.url!}
              controls
              className="rounded-md object-cover w-full max-w-[300px]"
              data-ai-hint="story video"
            />
            <OverlayTimeAndStatus />
          </div>
        );
      case 'text':
      default:
        return (
          <>
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
            <div className="mt-1"><TimeAndStatus /></div>
          </>
        )
    }
  };

  return (
    <div className={cn("flex mb-2", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "rounded-lg shadow",
        isUser ? "bg-whatsapp-user-message" : "bg-white",
        (message.type === 'image' || message.type === 'video') ? 'p-1' :
        message.type === 'audio' ? 'py-2 px-2.5' :
        'p-2',
        "max-w-[85%] md:max-w-[75%]"
      )}>
        {renderContent()}
      </div>
    </div>
  );
}
