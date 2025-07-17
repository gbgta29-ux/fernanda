
"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/types/message";
import { sendMessage, createPixCharge, checkPaymentStatus, type PixChargeData } from "@/app/actions";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RefreshCw, Play } from 'lucide-react';
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { track as fpixelTrack } from '@/lib/fpixel';

type FlowStep = 
  | 'initial'
  | 'awaiting_name'
  | 'awaiting_amor_permission'
  | 'awaiting_after_gostar_response'
  | 'awaiting_after_picante_response'
  | 'awaiting_after_audio_10_response'
  | 'awaiting_after_audio_11_response'
  | 'awaiting_after_audio_12_response'
  | 'awaiting_after_audio_14_response'
  | 'awaiting_pix_confirmation_response'
  | 'awaiting_pix_payment'
  | 'payment_confirmed'
  | 'chat_mode';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Digitando...");
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [userName, setUserName] = useState('');
  const [city, setCity] = useState('do Brasil');
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u")) ||
        (e.ctrlKey && (e.key === "S" || e.key === "s"))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const playNotificationSound = () => {
    notificationSoundRef.current?.play().catch(console.error);
  }

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp' | 'status'>, sender: 'user' | 'bot'): Message => {
    if (sender === 'bot') {
      playNotificationSound();
    }
    const fullMessage: Message = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: sender === 'user' ? 'read' : 'sent',
      ...msg,
      sender,
    };
    setMessages(prev => [...prev, fullMessage]);
    return fullMessage;
  };
  
  const playAudioSequence = async (audioId: number, url: string) => {
    playNotificationSound();
    await delay(500);
    await new Promise<void>(resolve => {
        const audioMessage = addMessage({ type: 'audio', url, onEnded: resolve }, 'bot');
        setAutoPlayingAudioId(audioMessage.id);
    });
    setAutoPlayingAudioId(null);
  };
  
  const showLoadingIndicator = async (duration: number, text: string = "Digitando...") => {
      setLoadingText(text);
      setIsLoading(true);
      await delay(duration);
      setIsLoading(false);
  };

  const getCity = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        return 'do Brasil';
      }
      const data = await response.json();
      return data.city || 'do Brasil';
    } catch (error) {
      console.error("Error fetching city:", error);
      return 'do Brasil';
    }
  };

  useEffect(() => {
    const runWelcomeFlow = async () => {
      const currentCity = await getCity();
      setCity(currentCity);
      
      await showLoadingIndicator(2000, "Gravando áudio...");
      await playAudioSequence(1, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/1-1.mp3');
      
      await showLoadingIndicator(2000, "Gravando áudio...");
      await playAudioSequence(2, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/2-1.mp3');
      
      await delay(3000);
      
      const encodedCity = encodeURIComponent(currentCity);
      const imageUrl = `https://res.cloudinary.com/drekat5vk/image/upload/co_rgb:FF0003,l_text:georgia_50_bold_italic_normal_left:${encodedCity}/fl_layer_apply,x_-25,y_-320/Design_sem_nome_13_y4bjqa`;
      addMessage({ type: 'image', url: imageUrl }, 'bot');
      
      await delay(2000);
      addMessage({ type: 'text', text: "Fotinha de agora meu bem 😍" }, 'bot');
      
      await showLoadingIndicator(2000, "Gravando áudio...");
      await playAudioSequence(3, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/3-1.mp3');

      await delay(2000);
      addMessage({ type: 'text', text: `E moro em ${currentCity}` }, 'bot');
      
      await delay(2000);
      addMessage({ type: 'text', text: "Qual seu nome, bb? 💗" }, 'bot');
      
      setShowInput(true);
      setFlowStep('awaiting_name');
    };

    if (isStarted) {
        runWelcomeFlow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  const handleCheckPayment = async () => {
    if (!pixData?.transactionId || isCheckingPayment) return;

    addMessage({ type: 'text', text: "Já paguei" }, 'user');
    setIsCheckingPayment(true);
    await showLoadingIndicator(2000);
    addMessage({ type: 'text', text: "Ok amor, só um momento que vou verificar... 😍" }, 'bot');
    
    await delay(10000);

    const result = await checkPaymentStatus(pixData.transactionId);

    if (result?.status === 'paid') {
      fpixelTrack('Purchase', { value: 10.00, currency: 'BRL' });
      addMessage({ type: 'text', text: "Pagamento confirmado amor. Clica abaixo para iniciar a chamada de vídeo." }, 'bot');
      setFlowStep('payment_confirmed');
    } else {
      await playAudioSequence(19, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/19.mp3');
    }
    setIsCheckingPayment(false);
  };

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);

    switch (flowStep) {
      case 'awaiting_name':
        setUserName(userMessageText);
        await delay(3000);
        await showLoadingIndicator(3000);
        addMessage({ type: 'text', text: `Adorei seu nome ${userMessageText}, 💗 posso te chamar de amor?` }, 'bot');
        setFlowStep('awaiting_amor_permission');
        setShowInput(true);
        break;

      case 'awaiting_amor_permission':
        await delay(3000);
        await showLoadingIndicator(3000, "Gravando áudio...");
        await playAudioSequence(4, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/4.mp3');
        await playAudioSequence(5, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/5.mp3');
        await showLoadingIndicator(3000);
        addMessage({ type: 'text', text: "Acho que vai gostar rsrs , posso mandar ?" }, 'bot');
        setFlowStep('awaiting_after_gostar_response');
        setShowInput(true);
        break;
        
      case 'awaiting_after_gostar_response':
        await delay(3000);
        await showLoadingIndicator(3000);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/Design-sem-nome-14.jpg' }, 'bot');
        await showLoadingIndicator(3000);
        addMessage({ type: 'text', text: "O que você achou bb??" }, 'bot');
        setFlowStep('awaiting_after_picante_response');
        setShowInput(true);
        break;

      case 'awaiting_after_picante_response':
        await delay(3000);
        await showLoadingIndicator(3000, "Gravando áudio...");
        await playAudioSequence(8, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/8.mp3');
        await playAudioSequence(9, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/9.mp3');
        await playAudioSequence(10, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/10.mp3');
        setFlowStep('awaiting_after_audio_10_response');
        setShowInput(true);
        break;

      case 'awaiting_after_audio_10_response':
        await delay(3000);
        await showLoadingIndicator(3000, "Gravando áudio...");
        await playAudioSequence(11, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/11.mp3');
        setFlowStep('awaiting_after_audio_11_response');
        setShowInput(true);
        break;

      case 'awaiting_after_audio_11_response':
        await delay(3000);
        await showLoadingIndicator(3000, "Gravando áudio...");
        await playAudioSequence(12, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/12.mp3');
        setFlowStep('awaiting_after_audio_12_response');
        setShowInput(true);
        break;

      case 'awaiting_after_audio_12_response':
        await delay(3000);
        await showLoadingIndicator(3000);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/salva-e.jpg' }, 'bot');
        await showLoadingIndicator(3000, "Gravando áudio...");
        await playAudioSequence(13, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/13.mp3');
        await playAudioSequence(14, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/14.mp3');
        setFlowStep('awaiting_after_audio_14_response');
        setShowInput(true);
        break;

      case 'awaiting_after_audio_14_response':
        await delay(3000);
        await showLoadingIndicator(3000, "Gravando áudio...");
        await playAudioSequence(15, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/15.mp3');
        await showLoadingIndicator(3000);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/Design-sem-nome-15.jpg' }, 'bot');
        await showLoadingIndicator(3000);
        addMessage({ type: 'video', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/JoinUs-@RisqueMega-163.mp4' }, 'bot');
        await showLoadingIndicator(3000, "Gravando áudio...");
        await playAudioSequence(16, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/16.mp3');
        await playAudioSequence(17, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/17.mp3');
        setFlowStep('awaiting_pix_confirmation_response');
        setShowInput(true);
        break;

      case 'awaiting_pix_confirmation_response':
        setIsCreatingPix(true);
        
        await showLoadingIndicator(1000, "Gravando áudio...");
        await playAudioSequence(18, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/18.mp3');
        
        addMessage({ type: 'text', text: "vou mandar meu pix pra você bb... 😍" }, 'bot');
        await showLoadingIndicator(3000);
        
        const charge = await createPixCharge();
        if (charge && charge.pixCopyPaste) {
          fpixelTrack('InitiateCheckout', { value: 10.00, currency: 'BRL' });
          setPixData(charge);
          setFlowStep('awaiting_pix_payment');
          addMessage({ type: 'text', text: "Prontinho amor, o valor é só R$10,00. Faz o pagamento pra gente gozar na chamada de vídeo..." }, 'bot');
          addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste });
        } else {
          addMessage({ type: 'text', text: "Ops, não consegui gerar o PIX agora, amor. Tenta de novo em um minutinho." }, 'bot');
          setShowInput(true); 
        }
        setIsCreatingPix(false);
        break;

      case 'chat_mode':
        try {
          await showLoadingIndicator(1500);
          const { response } = await sendMessage(userMessageText);
          addMessage({ type: 'text', text: response }, 'bot');
        } catch (error) {
          console.error(error);
          addMessage({ type: 'text', text: "Desculpe, ocorreu um erro ao processar sua mensagem." }, 'bot');
        }
        setShowInput(true);
        break;
    }
  };

  return (
    <div className="bg-[#111B21] flex items-center justify-center h-screen font-body select-none">
      <div className="w-full h-dvh sm:w-[450px] sm:h-[95vh] sm:max-h-[900px] flex flex-col bg-background shadow-2xl relative overflow-hidden">
          {!isStarted && (
            <div className="absolute inset-0 bg-black/70 z-20 flex flex-col items-center justify-center gap-4 text-center p-4">
               <Image
                src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/perfil.jpg"
                alt="Valesca Carvalho"
                width={80}
                height={80}
                className="rounded-full border-4 border-white"
              />
              <h1 className="text-white text-2xl font-bold">Valesca Carvalho</h1>
              <p className="text-white/80">Enviou uma nova mensagem de áudio</p>
              <Button onClick={() => setIsStarted(true)} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4">
                <Play className="mr-2" />
                Ouvir agora
              </Button>
            </div>
          )}
          <ChatHeader />
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              backgroundImage: "url('https://i.pinimg.com/originals/34/8f/c9/348fc9806e32bba0fb4c42e799ddf880.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatMessages messages={messages} isLoading={isLoading} loadingText={loadingText} autoPlayingAudioId={autoPlayingAudioId} />
          </div>

          {flowStep === 'awaiting_pix_payment' && (
            <div className="p-4 bg-background border-t border-border/20 flex flex-col items-center gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                <span>Aguardando pagamento...</span>
              </div>
              <Button
                  onClick={handleCheckPayment}
                  disabled={isCheckingPayment || !pixData}
                  className="w-full bg-primary text-primary-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-primary/90"
              >
                  {isCheckingPayment ? (
                      <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                      </>
                  ) : (
                      'Já paguei'
                  )}
              </Button>
            </div>
          )}

          {flowStep === 'payment_confirmed' && (
             <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                <Link href="https://studio--chamada-dkhvg.us-central1.hosted.app" target="_blank">
                  Iniciar chamada de vídeo
                </Link>
              </Button>
            </div>
          )}

          {showInput && <ChatInput formAction={formAction} disabled={isLoading || isCreatingPix} />}
          <audio ref={notificationSoundRef} src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/adew.mp3" preload="auto" />
      </div>
    </div>
  );
}

