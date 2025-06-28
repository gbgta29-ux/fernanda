"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/types/message";
import { sendMessage } from "@/app/actions";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";

const playAndAwait = (url: string) => {
  return new Promise<void>(resolve => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => {
      console.error(`Failed to load audio: ${url}`);
      resolve(); 
    };
    audio.play().catch(err => {
      console.error(`Audio playback error:`, err);
      resolve(); 
    });
  });
};


export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlowRunning, setIsFlowRunning] = useState(true);
  const sendSoundRef = useRef<HTMLAudioElement>(null);

  const addBotMessage = (message: Omit<Message, 'id' | 'timestamp' | 'status' | 'sender'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now() + prev.length,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
    }]);
  };
  
  useEffect(() => {
    const runWelcomeFlow = async () => {
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      setIsFlowRunning(true);
      setMessages([]);

      const audio1Url = 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/1-1.mp3';
      const audio2Url = 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/2-1.mp3';

      // Audio 1
      setIsLoading(true);
      await delay(2000);
      setIsLoading(false);
      addBotMessage({
        type: 'audio',
        url: audio1Url,
      });
      await playAndAwait(audio1Url);
      await delay(3000);

      // Audio 2
      setIsLoading(true);
      await delay(2000);
      setIsLoading(false);
      addBotMessage({
        type: 'audio',
        url: audio2Url,
      });
      await playAndAwait(audio2Url);
      await delay(3000);

      // Geolocation Image
      try {
        const geoResponse = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (!geoResponse.ok) throw new Error('Failed to fetch geo data');
        const geoData = await geoResponse.json();
        const city = geoData.city || 'do Brasil';
        const encodedCity = encodeURIComponent(city);
        const imageUrl = `https://res.cloudinary.com/dxqmzd84a/image/upload/co_rgb:000000,l_text:roboto_50_bold_normal_left:${encodedCity}/fl_layer_apply,x_50,y_425/Design_sem_nome_12_txxzjl`;
        
        addBotMessage({ type: 'image', url: imageUrl });

      } catch (error) {
        console.error("Geolocation flow error:", error);
         addBotMessage({ type: 'text', text: 'Seja muito bem-vindo(a)!' });
      }

      setIsFlowRunning(false);
    };

    runWelcomeFlow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      type: 'text',
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);
    sendSoundRef.current?.play().catch(console.error);
    setIsLoading(true);

    try {
      const { response } = await sendMessage(userMessageText);
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        type: 'text',
        text: response,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: "read",
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setMessages((prev) => 
        prev.map(msg => msg.id === userMessage.id ? {...msg, status: 'read'} : msg)
      );

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        type: 'text',
        text: "Desculpe, ocorreu um erro ao processar sua mensagem.",
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: "read",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111B21] flex items-center justify-center h-screen font-body">
      <div className="w-full h-dvh sm:w-[450px] sm:h-[95vh] sm:max-h-[900px] flex flex-col bg-background shadow-2xl">
          <ChatHeader />
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              backgroundImage: "url('https://i.pinimg.com/originals/34/8f/c9/348fc9806e32bba0fb4c42e799ddf880.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatMessages messages={messages} isLoading={isLoading} />
          </div>
          <ChatInput formAction={formAction} disabled={isLoading || isFlowRunning} />
          <audio ref={sendSoundRef} src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/Efeito-sonoro-Whatsapp-dpbOO-8AIPo.mp3" preload="auto" />
      </div>
    </div>
  );
}
