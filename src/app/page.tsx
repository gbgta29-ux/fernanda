
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
  | 'awaiting_sexy_photo_choice'
  | 'awaiting_tesao_response'
  | 'awaiting_video_feedback'
  | 'awaiting_promise'
  | 'awaiting_pix_permission_options'
  | 'awaiting_pix_generation'
  | 'awaiting_pix_payment'
  | 'awaiting_discount_offer_choice'
  | 'payment_confirmed_awaiting_upsell_choice'
  | 'awaiting_upsell_pix_payment'
  | 'upsell_payment_confirmed'
  | 'flow_complete_video_only'
  | 'flow_ended'
  | 'chat_mode';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Digitando...");
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pixData, setPixData] = useState<(PixChargeData & { value: number }) | null>(null);
  const [upsellPixData, setUpsellPixData] = useState<(PixChargeData & { value: number }) | null>(null);
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

  const playAudioSequence = async (audioId: number, url: string, waitTime = 1500) => {
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

  useEffect(() => {
    const runWelcomeFlow = async () => {
      await showLoadingIndicator(1500, "Gravando áudio...");
      await playAudioSequence(1, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/atdqhpgrvds_1761505648918.mp3');
      await playAudioSequence(2, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/4yk7dyz8ul2_1761505826958.mp3');

      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: "vou te enviar uma fotinha" }, 'bot');
      await showLoadingIndicator(1500);
      
      addMessage({ type: 'image', url: 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/vkf6vuc43j9_1770842900350.jpg' }, 'bot');
      await showLoadingIndicator(6500, "Gravando áudio...");
      await playAudioSequence(3, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/9tuzx1irro_1761506386680.mp3', 3000);
      addMessage({ type: 'text', text: "quer ver uma fotinha minha mais safada ??" }, 'bot');
      setFlowStep('awaiting_sexy_photo_choice');
    };

    if (isStarted) {
        runWelcomeFlow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  const handleCreatePix = async (value: number, isUpsell: boolean = false) => {
    setIsCreatingPix(true);
    if (!isUpsell) {
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence(17, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/l1be2q1igvo_1761511117948.mp3');
    }
    
    const charge = await createPixCharge(value);
    if (charge && charge.pixCopyPaste) {
      fpixelTrack('InitiateCheckout', { value: value / 100, currency: 'BRL' });
      if(isUpsell) {
        setUpsellPixData({ ...charge, value });
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
        setFlowStep('awaiting_upsell_pix_payment');
      } else {
        setPixData({ ...charge, value });
        setFlowStep('awaiting_pix_payment');
        addMessage({ type: 'text', text: `Prontinho amor, o valor é só R$${(value / 100).toFixed(2).replace('.', ',')}. Faz o pagamento pra gente gozar na chamada de vídeo...` }, 'bot');
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
      }
    } else {
      addMessage({ type: 'text', text: "Ops, não consegui gerar o PIX agora, amor. Tenta de novo em um minutinho." }, 'bot');
      setFlowStep(isUpsell ? 'payment_confirmed_awaiting_upsell_choice' : 'awaiting_pix_permission_options');
      if(!isUpsell) setShowInput(true); 
    }
    setIsCreatingPix(false);
  };

  const handleCheckPayment = async (txId: string, value: number, isUpsell: boolean = false) => {
    if (!txId || isCheckingPayment) return;

    addMessage({ type: 'text', text: "Já paguei" }, 'user');
    
    setIsCheckingPayment(true);
    await showLoadingIndicator(1500);
    addMessage({ type: 'text', text: "Ok amor, só um momento que vou verificar... 😍" }, 'bot');
    
    await delay(8000);

    const result = await checkPaymentStatus(txId);

    if (result?.status === 'paid') {
      fpixelTrack('Purchase', { value: value / 100, currency: 'BRL' });
      if (isUpsell) {
        addMessage({ type: 'text', text: "Pagamento confirmado, gostoso! 🔥 Clica no botão abaixo pra gente conversar no WhatsApp agora mesmo!" }, 'bot');
        setFlowStep('upsell_payment_confirmed');
      } else {
        await showLoadingIndicator(1500, "Gravando áudio...");
        await playAudioSequence(20, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/58z6uxxwgx_1761515866483.mp3');
        addMessage({ type: 'text', text: "Amor, acabei de liberar meu número pessoal pra você... Quer pagar só mais R$ 10,97 pra gente conversar por lá? 😏" }, 'bot');
        setFlowStep('payment_confirmed_awaiting_upsell_choice');
      }
    } else {
      await playAudioSequence(19, 'https://imperiumfragrance.shop/wp-content/uploads/2025/07/ElevenLabs_2025-07-26T21_25_01_Keren-Young-Brazilian-Female_pvc_sp110_s30_sb30_v3-1.mp3');
    }
    setIsCheckingPayment(false);
  };

  const handleUpsellChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial'); // Disable buttons
    if (choice === 'yes') {
        addMessage({ type: 'text', text: 'Sim, eu quero!' }, 'user');
        setIsCreatingPix(true);
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: 'Oba! Sabia que você ia querer, amor. Vou gerar o PIX de R$10,97 pra você.' }, 'bot');
        await handleCreatePix(1097, true);
        setIsCreatingPix(false);

    } else {
        addMessage({ type: 'text', text: 'Não, obrigado' }, 'user');
        await showLoadingIndicator(1500);
        addMessage({ type: 'text', text: 'Tudo bem, amor. Sem problemas! Podemos fazer só a chamada de vídeo então. Clica no botão abaixo pra gente começar. 😍' }, 'bot');
        setFlowStep('flow_complete_video_only');
    }
  }

  const handlePixPermissionChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial');
    if (choice === 'yes') {
      addMessage({ type: 'text', text: 'Manda o Pix bb 💸' }, 'user');
      await showLoadingIndicator(1500);
      await handleCreatePix(997);
    } else {
      addMessage({ type: 'text', text: 'Não tô pronto ainda 😕' }, 'user');
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: "Tudo bem, amor. Que tal um precinho especial só pra você? Faço por R$5,00 pra gente ter nossa chamada... O que me diz?" }, 'bot');
      setFlowStep('awaiting_discount_offer_choice');
    }
  };

  const handleDiscountOfferChoice = async (choice: 'yes' | 'no') => {
    setFlowStep('initial');
    if (choice === 'yes') {
      addMessage({ type: 'text', text: 'pode ser' }, 'user');
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: 'Oba! Sabia que você ia aceitar, amor. Vou gerar o PIX de R$5,00 pra você.' }, 'bot');
      await handleCreatePix(500);
    } else {
      addMessage({ type: 'text', text: 'não quero' }, 'user');
      await showLoadingIndicator(1500);
      addMessage({ type: 'text', text: "Tudo bem, amor. Deixa pra próxima então. Beijos! 😘" }, 'bot');
      setFlowStep('flow_ended');
    }
  };

  const handleSexyPhotoChoice = async () => {
    setFlowStep('initial');
    addMessage({ type: 'text', text: 'Quero' }, 'user');
    await showLoadingIndicator(1500);
    addMessage({ type: 'image', url: 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/6skv7fkm6d4_1770844274301.jpg' }, 'bot');
    
    await showLoadingIndicator(6500, "Gravando áudio...");
    await playAudioSequence(4, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/jctfc3a2pza_1761506844815.mp3', 3000);
    
    await showLoadingIndicator(3000, "Gravando áudio...");
    await playAudioSequence(4.5, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/0c1gif2e8ss_1761506894706.mp3', 3000);
    
    await showLoadingIndicator(3000);
    addMessage({ type: 'video', url: 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/h7heyveuopm_1770842899682.mp4' }, 'bot');

    await showLoadingIndicator(10000); // Wait for video
    
    await showLoadingIndicator(3000, "Gravando áudio...");
    await playAudioSequence(5, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/g188srlja0w_1761507756670.mp3', 3000);
    
    addMessage({ type: 'text', text: "eae bb sentiu tesão??" }, 'bot');
    setFlowStep('awaiting_tesao_response');
    setShowInput(true);
  }

  const handleVideoFeedback = async (feedback: 'good' | 'bad') => {
      setFlowStep('initial');
      addMessage({ type: 'text', text: feedback === 'good' ? 'Ficou uma delícia 🤤' : 'Ahhh mais ou menos 😅' }, 'user');

      await showLoadingIndicator(3000, "Gravando áudio...");
      await playAudioSequence(10, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/3furhsk20ct_1761510803757.mp3', 3000);
      await playAudioSequence(11, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/dyrol02mcxb_1761510853350.mp3', 3000);

      addMessage({ type: 'text', text: 'promete bb??' }, 'bot');
      setFlowStep('awaiting_promise');
  }

  const handlePromise = async () => {
    setFlowStep('initial');
    addMessage({ type: 'text', text: 'sim, prometo' }, 'user');

    await showLoadingIndicator(3000, "Gravando áudio...");
    await playAudioSequence(12, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/02obruycp345_1761510950384.mp3', 3000);
    await playAudioSequence(13, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/v8hq5bxd7im_1770830835651.mp3', 3000);

    addMessage({ type: 'text', text: 'posso te mandar o Pix?' }, 'bot');
    setFlowStep('awaiting_pix_permission_options');
  }

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);
    
    switch (flowStep) {
      case 'awaiting_tesao_response':
        await showLoadingIndicator(2000);
        addMessage({ type: 'video', url: 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/xbf1z3iza0p_1770842898461.mp4'}, 'bot');
        
        await showLoadingIndicator(10000, "Gravando áudio...");
        await playAudioSequence(6, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/omlkocn5fdq_1761507970995.mp3', 3000);
        await playAudioSequence(7, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/m7mxonz7xyj_1761508998825.mp3', 3000);
        await playAudioSequence(8, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/4rm1t5sc7kt_1761509067729.mp3', 3000);
        await playAudioSequence(9, 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/oy3f9objucc_1761510706822.mp3', 3000);
        
        addMessage({ type: 'text', text: 'o que achou do videozinho ?'}, 'bot');
        setFlowStep('awaiting_video_feedback');
        break;

      case 'chat_mode':
        try {
          await showLoadingIndicator(3500);
          const { response } = await sendMessage(userMessageText);
          addMessage({ type: 'text', text: response }, 'bot');
        } catch (error) {
          console.error(error);
          addMessage({ type: 'text', text: "Desculpe, ocorreu um erro ao processar sua mensagem." }, 'bot');
        }
        setShowInput(true);
        break;
      
      default:
        setShowInput(true);
        break;
    }
  };

  return (
    <div className="bg-gradient-to-b from-red-900 via-red-800 to-black flex items-center justify-center h-screen font-body select-none">
      <div className="w-full h-dvh sm:w-[450px] sm:h-[95vh] sm:max-h-[900px] flex flex-col bg-background shadow-2xl relative overflow-hidden">
          {!isStarted && (
            <div className="absolute inset-0 bg-gradient-to-b from-red-900 via-red-800 to-black z-20 flex flex-col items-center justify-center gap-6 text-center p-4 animate-fadeIn">
              <div className="relative">
                <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQV8VLsrH3aHE_53oxsj2iC9KgH2npKyxW1gw&s"
                    alt="Lari"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-white object-cover aspect-square shadow-2xl animate-pulseGlow"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-white text-3xl font-bold tracking-tight">Lari</h1>
                <p className="text-white/80 text-lg">enviou uma nova mensagem de áudio</p>
              </div>
              <Button onClick={() => setIsStarted(true)} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground mt-6 rounded-full py-7 px-10 text-lg font-bold shadow-lg animate-pulseButton">
                <Play className="mr-3 h-6 w-6" />
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
                    const tx = flowStep === 'awaiting_pix_payment' ? pixData : upsellPixData;
                    if (tx) {
                      handleCheckPayment(tx.transactionId, tx.value, flowStep === 'awaiting_upsell_pix_payment');
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
          
          {flowStep === 'awaiting_pix_permission_options' && (
             <div className="p-4 bg-background border-t border-border/20 flex items-center justify-center gap-4">
                <Button onClick={() => handlePixPermissionChoice('yes')} className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                    Manda o Pix bb 💸
                </Button>
                <Button onClick={() => handlePixPermissionChoice('no')} className="w-full bg-destructive text-destructive-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-destructive/90">
                    Não tô pronto ainda 😕
                </Button>
            </div>
          )}

          {flowStep === 'awaiting_sexy_photo_choice' && (
            <div className="p-4 bg-background border-t border-border/20 flex items-center justify-center gap-4">
              <Button onClick={handleSexyPhotoChoice} className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                Quero
              </Button>
            </div>
          )}

          {flowStep === 'awaiting_discount_offer_choice' && (
             <div className="p-4 bg-background border-t border-border/20 flex items-center justify-center gap-4">
                <Button onClick={() => handleDiscountOfferChoice('yes')} className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                    pode ser
                </Button>
                <Button onClick={() => handleDiscountOfferChoice('no')} className="w-full bg-destructive text-destructive-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-destructive/90">
                    não quero
                </Button>
            </div>
          )}
          
          {flowStep === 'awaiting_video_feedback' && (
              <div className="p-4 bg-background border-t border-border/20 flex flex-col items-center justify-center gap-2">
                <Button onClick={() => handleVideoFeedback('good')} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-full shadow-md hover:bg-primary/90">
                    Ficou uma delícia 🤤
                </Button>
                <Button onClick={() => handleVideoFeedback('bad')} className="w-full bg-white text-gray-800 font-semibold py-3 rounded-full shadow-md hover:bg-gray-200 border border-gray-300">
                    Ahhh mais ou menos 😅
                </Button>
              </div>
          )}
          
          {flowStep === 'awaiting_promise' && (
             <div className="p-4 bg-background border-t border-border/20 flex items-center justify-center gap-4">
                <Button onClick={handlePromise} className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                    sim, prometo
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
                <Link href="https://wa.me/554399540418?text=Oi%20Lari%2C%20tudo%20bem%20%3F%20comprei%20sua%20chamadinha%20de%20v%C3%ADdeo.%20quando%20voc%C3%AA%20est%C3%A1%20disponivel%20%3F" target="_blank">
                  Conversar no WhatsApp
                </Link>
              </Button>
            </div>
          )}

          {flowStep === 'flow_complete_video_only' && (
             <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                <Link href="https://thunderous-alpaca-417e09.netlify.app/" target="_blank">
                  Ver conteúdo
                </Link>
              </Button>
            </div>
          )}
          
          {flowStep === 'flow_ended' && (
            <div className="p-4 bg-background border-t border-border/20">
              <p className="text-center text-sm text-muted-foreground">A conversa terminou.</p>
            </div>
          )}

          {showInput && <ChatInput formAction={formAction} disabled={isLoading || isCreatingPix} />}
          <audio ref={notificationSoundRef} src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/adew.mp3" preload="auto" />
      </div>
    </div>
  );
}
