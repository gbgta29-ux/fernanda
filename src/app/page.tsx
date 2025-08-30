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
  | 'awaiting_photo_permission'
  | 'awaiting_name'
  | 'awaiting_user_city'
  | 'awaiting_second_photo_permission'
  | 'awaiting_after_second_photo'
  | 'awaiting_chupar_ou_fuder'
  | 'awaiting_video_permission'
  | 'awaiting_call_permission'
  | 'awaiting_pix_permission'
  | 'awaiting_pix_payment'
  | 'payment_confirmed_awaiting_upsell_choice'
  | 'awaiting_upsell_pix_payment'
  | 'upsell_payment_confirmed'
  | 'flow_complete_video_only'
  | 'chat_mode';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Digitando...");
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [userName, setUserName] = useState('');
  const [userCity, setUserCity] = useState('');
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const [upsellPixData, setUpsellPixData] = useState<PixChargeData | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const playAudioSequence = async (audioId: number, url: string, waitTime = 3000) => {
    playNotificationSound();
    await new Promise<void>(resolve => {
        const audioMessage = addMessage({ type: 'audio', url, onEnded: resolve }, 'bot');
        setAutoPlayingAudioId(audioMessage.id);
    });
    setAutoPlayingAudioId(null);
    await delay(waitTime);
  };
  
  const showLoadingIndicator = async (duration: number, text: string = "Digitando...") => {
      setLoadingText(text);
      setIsLoading(true);
      await delay(duration);
      setIsLoading(false);
  };

  const getCity = async () => {
    try {
      const response = await fetch('https://get.geojs.io/v1/ip/city.json');
      if (!response.ok) {
        const fallbackResponse = await fetch('https://ipapi.co/json/');
         if(!fallbackResponse.ok) return 'do Brasil';
        const fallbackData = await fallbackResponse.json();
        return fallbackData.city || 'do Brasil'
      }
      const data = await response.json();
      return data.city ? decodeURIComponent(escape(data.city)) : 'do Brasil';
    } catch (error) {
      console.error("Error fetching city:", error);
      return 'do Brasil';
    }
  };

  useEffect(() => {
    const runWelcomeFlow = async () => {
      await showLoadingIndicator(5000, "Gravando áudio...");
      await playAudioSequence(1, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-1.mp3', 3000);
      await playAudioSequence(2, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-2.mp3', 3000);

      await showLoadingIndicator(7000);
      addMessage({ type: 'text', text: "posso enviar uma fotinha bb???" }, 'bot');
      setShowInput(true);
      setFlowStep('awaiting_photo_permission');
    };

    if (isStarted) {
        runWelcomeFlow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  const handleCreatePix = async (value: number, isUpsell: boolean = false) => {
    setIsCreatingPix(true);
    if (!isUpsell) {
        await showLoadingIndicator(5000, "Gravando áudio...");
        await playAudioSequence(1, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/zanam1atwtdp2u0wk192fa0x.mp3', 3000);
    }
    
    const charge = await createPixCharge(value);
    if (charge && charge.pixCopyPaste) {
      fpixelTrack('InitiateCheckout', { value: value / 100, currency: 'BRL' });
      if(isUpsell) {
        setUpsellPixData(charge);
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
        setFlowStep('awaiting_upsell_pix_payment');
      } else {
        setPixData(charge);
        setFlowStep('awaiting_pix_payment');
        addMessage({ type: 'text', text: `Prontinho amor, o valor é só R$${(value / 100).toFixed(2).replace('.', ',')}. Faz o pagamento pra gente gozar na chamada de vídeo...` }, 'bot');
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
      }
    } else {
      addMessage({ type: 'text', text: "Ops, não consegui gerar o PIX agora, amor. Tenta de novo em um minutinho." }, 'bot');
      setFlowStep(isUpsell ? 'payment_confirmed_awaiting_upsell_choice' : 'awaiting_call_permission');
      if(!isUpsell) setShowInput(true); 
    }
    setIsCreatingPix(false);
  };

  const handleCheckPayment = async (txId: string, value: number, isUpsell: boolean = false) => {
    if (!txId || isCheckingPayment) return;

    addMessage({ type: 'text', text: "Já paguei" }, 'user');
    
    setIsCheckingPayment(true);
    await showLoadingIndicator(5000);
    addMessage({ type: 'text', text: "Ok amor, só um momento que vou verificar... 😍" }, 'bot');
    
    await delay(10000);

    const result = await checkPaymentStatus(txId);

    if (result?.status === 'paid') {
      fpixelTrack('Purchase', { value: value / 100, currency: 'BRL' });
      if (isUpsell) {
        addMessage({ type: 'text', text: "Pagamento confirmado, gostoso! 🔥 Clica no botão abaixo pra gente conversar no WhatsApp agora mesmo!" }, 'bot');
        setFlowStep('upsell_payment_confirmed');
      } else {
        await showLoadingIndicator(5000, "Gravando áudio...");
        await playAudioSequence(20, 'https://imperiumfragrance.shop/wp-content/uploads/2025/07/ElevenLabs_2025-07-25T23_51_20_Keren-Young-Brazilian-Female_pvc_sp110_s30_sb30_v3.mp3', 3000);
        addMessage({ type: 'text', text: "Amor, acabei de liberar meu número pessoal pra você... Quer pagar só mais R$ 20,00 pra gente conversar por lá? 😏" }, 'bot');
        setFlowStep('payment_confirmed_awaiting_upsell_choice');
      }
    } else {
      await playAudioSequence(19, 'https://imperiumfragrance.shop/wp-content/uploads/2025/07/ElevenLabs_2025-07-26T21_25_01_Keren-Young-Brazilian-Female_pvc_sp110_s30_sb30_v3-1.mp3', 3000);
    }
    setIsCheckingPayment(false);
  };

  const handleUpsellChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial'); // Disable buttons
    if (choice === 'yes') {
        addMessage({ type: 'text', text: 'Sim, eu quero!' }, 'user');
        setIsCreatingPix(true);
        await showLoadingIndicator(5000);
        addMessage({ type: 'text', text: 'Oba! Sabia que você ia querer, amor. Vou gerar o PIX de R$20,00 pra você.' }, 'bot');
        await handleCreatePix(1999, true);
        setIsCreatingPix(false);

    } else {
        addMessage({ type: 'text', text: 'Não, obrigado' }, 'user');
        await showLoadingIndicator(5000);
        addMessage({ type: 'text', text: 'Tudo bem, amor. Sem problemas! Podemos fazer só a chamada de vídeo então. Clica no botão abaixo pra gente começar. 😍' }, 'bot');
        setFlowStep('flow_complete_video_only');
    }
  }

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);
    await showLoadingIndicator(11000);

    switch (flowStep) {
      case 'awaiting_photo_permission':
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/115bf82a-e093-48ba-81dc-7044ed489ee1.jpg' }, 'bot');
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(3, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-3.mp3', 3000);
        await playAudioSequence(4, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-4.mp3', 3000);
        await showLoadingIndicator(11000);
        addMessage({ type: 'text', text: "qual o seu nome safado ??? ❤" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_name');
        break;

      case 'awaiting_name':
        setUserName(userMessageText);
        addMessage({ type: 'text', text: `${userMessageText}, nome de homem gostoso hehe 🔥😋` }, 'bot');
        await showLoadingIndicator(11000);
        const currentCity = await getCity();
        addMessage({ type: 'text', text: `eu moro em ${currentCity} gostoso,` }, 'bot');
        await showLoadingIndicator(11000);
        addMessage({ type: 'text', text: "e você bb, de que cidade você é ?" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_user_city');
        break;

      case 'awaiting_user_city':
        setUserCity(userMessageText);
        addMessage({ type: 'text', text: `aah bb, eu ja fui pra ai. muito bom saber que você é de ${userMessageText} 😍😊` }, 'bot');
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(5, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-5.mp3', 3000);
        await playAudioSequence(6, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-6.mp3', 3000);
        await showLoadingIndicator(11000);
        addMessage({ type: 'text', text: "posso mandar outra fotinha ?" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_second_photo_permission');
        break;

      case 'awaiting_second_photo_permission':
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/safaaaaaaaaaaaa.jpg' }, 'bot');
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(7, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-7.mp3', 3000);
        await showLoadingIndicator(11000);
        addMessage({ type: 'text', text: "o que achou da  fotinha bb ? te deu tesão" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_after_second_photo');
        break;

      case 'awaiting_after_second_photo':
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(8, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-8.mp3', 3000);
        await showLoadingIndicator(11000);
        addMessage({ type: 'text', text: "voce ia  me chupar todinha ou me fuder gostoso ? ou fazer os 2 ? hehe 🔥🔥" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_chupar_ou_fuder');
        break;

      case 'awaiting_chupar_ou_fuder':
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(9, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-9.mp3', 3000);
        await playAudioSequence(10, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-10.mp3', 3000);
        await showLoadingIndicator(11000);
        addMessage({ type: 'text', text: "vou mandar uma fotinha e um video pra vc s2, espero que goste ." }, 'bot');
        await showLoadingIndicator(11000);
        addMessage({ type: 'text', text: "posso mandar ??? 🔥🔥" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_video_permission');
        break;

      case 'awaiting_video_permission':
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(11, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-11.mp3', 3000);
        await showLoadingIndicator(11000);
        addMessage({ type: 'video', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/0829-1.mp4' }, 'bot');
        await showLoadingIndicator(11000);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/%F0%9F%94%A5.jpg' }, 'bot');
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(12, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-12.mp3', 3000);
        await playAudioSequence(13, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-13.mp3', 3000);
        await showLoadingIndicator(11000);
        addMessage({ type: 'text', text: "o que acha da gente brincar em uma chamadinha de vídeo só nos dois?? 😊😊" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_call_permission');
        break;

      case 'awaiting_call_permission':
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(14, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-14.mp3', 3000);
        await playAudioSequence(15, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-15.mp3', 3000);
        addMessage({ type: 'text', text: "você vai querer ? bb uma chamadinha de video bem deliciosa comigo ??" }, 'bot');
        addMessage({ type: 'text', text: "posso te mandar meu pix amorzinho" }, 'bot');
        setShowInput(true);
        setFlowStep('awaiting_pix_permission');
        break;

      case 'awaiting_pix_permission':
        await showLoadingIndicator(11000, "Gravando áudio...");
        await playAudioSequence(16, 'https://imperiumfragrance.shop/wp-content/uploads/2025/08/AUDIO-16.mp3', 3000);
        await handleCreatePix(1498);
        break;
      
      case 'chat_mode':
        try {
          await showLoadingIndicator(4500);
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
                src="https://content.api.news/v3/images/bin/55d056d95292fb33b583e37fdbbc2ddf"
                alt="Fernanda Lopes"
                width={80}
                height={80}
                className="rounded-full border-4 border-white object-cover aspect-square"
              />
              <h1 className="text-white text-2xl font-bold">Fernanda Lopes</h1>
              <p className="text-white/80">Mandou uma nova mensagem de audio</p>
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
              backgroundImage: "url('https://i.redd.it/ts7vuoswhwf41.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatMessages messages={messages} isLoading={isLoading} loadingText={loadingText} autoPlayingAudioId={autoPlayingAudioId} />
          </div>

          {(flowStep === 'awaiting_pix_payment' || flowStep === 'awaiting_upsell_pix_payment') && (
            <div className="p-4 bg-background border-t border-border/20 flex flex-col items-center gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                <span>Aguardando pagamento...</span>
              </div>
              <Button
                  onClick={() => {
                    if (flowStep === 'awaiting_pix_payment' && pixData) {
                      handleCheckPayment(pixData.transactionId, 1498, false);
                    } else if (flowStep === 'awaiting_upsell_pix_payment' && upsellPixData) {
                       handleCheckPayment(upsellPixData.transactionId, 1999, true);
                    }
                  }}
                  disabled={isCheckingPayment || (flowStep === 'awaiting_pix_payment' && !pixData) || (flowStep === 'awaiting_upsell_pix_payment' && !upsellPixData)}
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
          
          {flowStep === 'payment_confirmed_awaiting_upsell_choice' && (
             <div className="p-4 bg-background border-t border-border/20 flex items-center justify-center gap-4">
                <Button onClick={() => handleUpsellChoice('yes')} className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                    Sim, eu quero!
                </Button>
                <Button onClick={() => handleUpsellChoice('no')} className="w-full bg-destructive text-destructive-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-destructive/90">
                    Não, obrigado
                </Button>
            </div>
          )}

          {flowStep === 'upsell_payment_confirmed' && (
             <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                <Link href="https://wa.me/554399599099?text=Oi%20fernanda%2C%20tudo%20bem%20%3F%20comprei%20sua%20chamadinha%20de%20v%C3%ADdeo.%20quando%20voc%C3%AA%20est%C3%A1%20disponivel%20%3F" target="_blank">
                  Conversar no WhatsApp
                </Link>
              </Button>
            </div>
          )}

          {flowStep === 'flow_complete_video_only' && (
             <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                <Link href="https://video-call-simulator-lty4.bolt.host/" target="_blank">
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
