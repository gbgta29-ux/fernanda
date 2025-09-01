"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  src: string;
  autoplay?: boolean;
  onEnded?: () => void;
}

const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function AudioPlayer({ src, autoplay = false, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      if (audio) setDuration(audio.duration);
    };
    const handleTimeUpdate = () => {
      if (audio) setCurrentTime(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (audio) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      onEnded?.();
    };
    
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(audio.duration || 0);
    setIsPlaying(!audio.paused);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    if (audio.readyState > 0) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, onEnded]);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (autoplay && audio) {
        audio.load();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Autoplay was prevented:", error);
            });
        }
    }
  }, [autoplay, src]);

  const togglePlayPause = () => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current && isFinite(duration) && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const togglePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const newRate = rates[(currentIndex + 1) % rates.length];
    if(audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
    setPlaybackRate(newRate);
  }

  const progress = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex w-full items-center gap-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <Button variant="ghost" size="icon" onClick={togglePlayPause} className="h-10 w-10 shrink-0 rounded-full">
        {isPlaying ? <Pause className="h-5 w-5 fill-gray-600 text-gray-600" /> : <Play className="h-5 w-5 fill-gray-600 text-gray-600" />}
      </Button>

      <div className="flex-1 space-y-1">
          <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="[&>span:first-of-type]:h-1 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary"
          />
          <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
          </div>
      </div>

      <Button variant="secondary" onClick={togglePlaybackRate} className="h-8 w-8 shrink-0 rounded-full bg-gray-200 p-0 text-xs font-bold text-gray-700 hover:bg-gray-300">
        {`${playbackRate}x`}
      </Button>
    </div>
  );
}
