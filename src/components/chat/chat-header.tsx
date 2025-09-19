import Image from 'next/image';
import { ArrowLeft, Video, Phone, MoreVertical, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  onTestClick: () => void;
}

export default function ChatHeader({ onTestClick }: ChatHeaderProps) {
  return (
    <header className="flex items-center p-2.5 bg-white text-black shadow-sm z-10 shrink-0">
      <button aria-label="Voltar" className="p-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </button>
      <Image
        src="https://imperiumfragrance.shop/wp-content/uploads/2025/09/pcYY6LyS2IcTVdOgom3rMG3mib6fhceVWn6EcT8qbCRKKvna-jjoIZ1VBKMi8OHrEHbsB3D6mCX3IssLufpNewM5bbkYvnWTI03B5SoXqF3wDRhqiZg2mmUnmslQOhSBTkzI7U5oWsuaT9Xv8Q.jpeg"
        data-ai-hint="woman profile"
        alt="Fernanda Lopes"
        width={40}
        height={40}
        className="rounded-full object-cover aspect-square"
      />
      <div className="ml-3 flex-1">
        <h1 className="font-semibold text-base leading-tight">Fernanda Lopes</h1>
        <p className="text-xs text-gray-600 leading-tight">online</p>
      </div>
      <div className="flex items-center space-x-1">
        {process.env.NODE_ENV === 'development' && (
            <Button onClick={onTestClick} variant="ghost" size="icon" aria-label="Modo Teste">
                <FlaskConical className="h-5 w-5" />
            </Button>
        )}
        <button aria-label="Video Call" className="p-2">
          <Video className="h-6 w-6" />
        </button>
        <button aria-label="Voice Call" className="p-2">
          <Phone className="h-6 w-6" />
        </button>
        <button aria-label="More options" className="p-2">
          <MoreVertical className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

    