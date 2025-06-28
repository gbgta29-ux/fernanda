"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/types/message";
import { sendMessage, createPixCharge, checkPaymentStatus, type PixChargeData } from "@/app/actions";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RefreshCw } from 'lucide-react';

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
  | 'awaiting_final_button_click'
  | 'awaiting_pix_payment'
  | 'payment_confirmed'
  | 'chat_mode';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [userName, setUserName] = useState('');
  const [city, setCity] = useState('do Brasil');
  const [showFinalButton, setShowFinalButton] = useState(false);
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  
  const playNotificationSound = () => {
    notificationSoundRef.current?.play().catch(console.error);
  }

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp' | 'status'>, sender: 'user' | 'bot'): Message => {
    const fullMessage: Message = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: sender === 'user' ? 'sent' : 'read',
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
  
  const showTypingIndicator = async (duration: number) => {
      setIsLoading(true);
      await delay(duration);
      setIsLoading(false);
  };

  useEffect(() => {
    const runWelcomeFlow = async () => {
      let currentCity = 'do Brasil';
      try {
        const geoResponse = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          currentCity = geoData.city || 'do Brasil';
          setCity(currentCity);
        }
      } catch (error) {
        console.error("Geolocation fetch error:", error);
      }
      
      await showTypingIndicator(2000);
      await playAudioSequence(1, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/1-1.mp3');
      
      await showTypingIndicator(2000);
      await playAudioSequence(2, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/2-1.mp3');
      
      await delay(3000);
      
      const encodedCity = encodeURIComponent(currentCity);
      const imageUrl = `https://res.cloudinary.com/dxqmzd84a/image/upload/co_rgb:000000,l_text:roboto_50_bold_normal_left:${encodedCity}/fl_layer_apply,x_50,y_425/Design_sem_nome_12_txxzjl`;
      playNotificationSound();
      await delay(500);
      addMessage({ type: 'image', url: imageUrl }, 'bot');
      
      await delay(2000);
      playNotificationSound();
      await delay(500);
      addMessage({ type: 'text', text: "Fotinha de agora meu bem 😍" }, 'bot');
      
      await showTypingIndicator(2000);
      await playAudioSequence(3, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/3-1.mp3');

      await delay(2000);
      playNotificationSound();
      await delay(500);
      addMessage({ type: 'text', text: `E moro em ${currentCity}` }, 'bot');
      
      await delay(2000);
      playNotificationSound();
      await delay(500);
      addMessage({ type: 'text', text: "Qual seu nome, bb? 💗" }, 'bot');
      
      setShowInput(true);
      setFlowStep('awaiting_name');
    };

    runWelcomeFlow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckPayment = async () => {
    if (!pixData?.transactionId || isCheckingPayment) return;

    addMessage({ type: 'text', text: "Já paguei" }, 'user');
    setIsCheckingPayment(true);
    await showTypingIndicator(2000);
    playNotificationSound();
    await delay(500);
    addMessage({ type: 'text', text: "Ok amor, só um momento que vou verificar... 😍" }, 'bot');
    
    await delay(10000);

    const result = await checkPaymentStatus(pixData.transactionId);

    if (result?.status === 'paid') {
      playNotificationSound();
      await delay(500);
      addMessage({ type: 'text', text: "Pagamento confirmado amor. Clica abaixo e vamos gozar na chamada de vídeo." }, 'bot');
      setFlowStep('payment_confirmed');
    } else {
      await playAudioSequence(19, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/19.mp3');
    }
    setIsCheckingPayment(false);
  };

  const handleFinalButtonClick = async () => {
    setShowFinalButton(false);
    setIsCreatingPix(true);
    addMessage({ type: 'text', text: "CLARO 💗" }, 'user');

    await showTypingIndicator(1000);

    await playAudioSequence(18, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/18.mp3');
    
    playNotificationSound();
    await delay(500);
    addMessage({ type: 'text', text: "Perfeito! Já vou gerar o PIX pra você... 😉" }, 'bot');
    await showTypingIndicator(3000);
    
    const charge = await createPixCharge();
    if (charge) {
      setPixData(charge);
      setFlowStep('awaiting_pix_payment');
      playNotificationSound();
      await delay(500);
      addMessage({ type: 'text', text: "Prontinho amor, o valor é só R$10,00. Faz o pagamento pra gente continuar..." }, 'bot');
      playNotificationSound();
      await delay(500);
      addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste });
    } else {
      playNotificationSound();
      await delay(500);
      addMessage({ type: 'text', text: "Ops, não consegui gerar o PIX agora, amor. Tenta de novo em um minutinho." }, 'bot');
      setShowFinalButton(true);
    }
    setIsCreatingPix(false);
  };

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);

    switch (flowStep) {
      case 'awaiting_name':
        setUserName(userMessageText);
        await showTypingIndicator(3000);
        playNotificationSound();
        await delay(500);
        addMessage({ type: 'text', text: `Adorei seu nome ${userMessageText}, 💗 posso te chamar de amor?` }, 'bot');
        setFlowStep('awaiting_amor_permission');
        break;

      case 'awaiting_amor_permission':
        await showTypingIndicator(3000);
        await playAudioSequence(4, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/4.mp3');
        await playAudioSequence(5, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/5.mp3');
        await showTypingIndicator(3000);
        playNotificationSound();
        await delay(500);
        addMessage({ type: 'text', text: "Acho que vai gostar rsrs" }, 'bot');
        setFlowStep('awaiting_after_gostar_response');
        break;
        
      case 'awaiting_after_gostar_response':
        await showTypingIndicator(3000);
        playNotificationSound();
        await delay(500);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/essa-.jpg' }, 'bot');
        await showTypingIndicator(3000);
        playNotificationSound();
        await delay(500);
        addMessage({ type: 'text', text: "O que você achou bb?? vou mostrar umas mais picantes" }, 'bot');
        setFlowStep('awaiting_after_picante_response');
        break;

      case 'awaiting_after_picante_response':
        await showTypingIndicator(3000);
        await playAudioSequence(8, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/8.mp3');
        await playAudioSequence(9, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/9.mp3');
        await playAudioSequence(10, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/10.mp3');
        setFlowStep('awaiting_after_audio_10_response');
        break;

      case 'awaiting_after_audio_10_response':
        await showTypingIndicator(3000);
        await playAudioSequence(11, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/11.mp3');
        setFlowStep('awaiting_after_audio_11_response');
        break;

      case 'awaiting_after_audio_11_response':
        await showTypingIndicator(3000);
        await playAudioSequence(12, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/12.mp3');
        setFlowStep('awaiting_after_audio_12_response');
        break;

      case 'awaiting_after_audio_12_response':
        await showTypingIndicator(3000);
        playNotificationSound();
        await delay(500);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/salva-e.jpg' }, 'bot');
        await showTypingIndicator(3000);
        await playAudioSequence(13, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/13.mp3');
        await playAudioSequence(14, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/14.mp3');
        setFlowStep('awaiting_after_audio_14_response');
        break;

      case 'awaiting_after_audio_14_response':
        await showTypingIndicator(3000);
        await playAudioSequence(15, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/15.mp3');
        await showTypingIndicator(3000);
        playNotificationSound();
        await delay(500);
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/IMAGEM.jpg' }, 'bot');
        await showTypingIndicator(3000);
        playNotificationSound();
        await delay(500);
        addMessage({ type: 'video', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/Sem-nome-Story.mp4' }, 'bot');
        await showTypingIndicator(3000);
        await playAudioSequence(16, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/16.mp3');
        await playAudioSequence(17, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/17.mp3');
        setFlowStep('awaiting_final_button_click');
        setShowFinalButton(true);
        break;

      case 'chat_mode':
        try {
          await showTypingIndicator(1500);
          const { response } = await sendMessage(userMessageText);
          playNotificationSound();
          await delay(500);
          addMessage({ type: 'text', text: response }, 'bot');
        } catch (error) {
          console.error(error);
          playNotificationSound();
          await delay(500);
          addMessage({ type: 'text', text: "Desculpe, ocorreu um erro ao processar sua mensagem." }, 'bot');
        }
        break;
    }
    
    if (flowStep !== 'awaiting_final_button_click' && flowStep !== 'awaiting_pix_payment') {
      setShowInput(true);
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
            <ChatMessages messages={messages} isLoading={isLoading} autoPlayingAudioId={autoPlayingAudioId} />
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
                <Link href="https://www.youtube.com/results?search_query=polling+como+fazer+pagamento" target="_blank">
                  Vamos gozar na chamada de vídeo 🔥
                </Link>
              </Button>
            </div>
          )}

          {showFinalButton && (
            <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button
                onClick={handleFinalButtonClick}
                disabled={isCreatingPix}
                className="w-full bg-primary text-primary-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-primary/90"
              >
                {isCreatingPix && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                CLARO 💗
              </Button>
            </div>
          )}
          {showInput && <ChatInput formAction={formAction} disabled={isLoading} />}
          <audio ref={notificationSoundRef} src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/adew.mp3" preload="auto" />
      </div>
    </div>
  );
}
