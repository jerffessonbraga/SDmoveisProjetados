import React, { useState } from 'react';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Louvor {
  title: string;
  artist: string;
  audioUrl: string;
  verse: string;
}

interface WorshipPlayerProps {
  currentLouvor: Louvor;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onNext: () => void;
}

export const WorshipPlayer: React.FC<WorshipPlayerProps> = ({
  currentLouvor,
  isPlaying,
  onPlay,
  onStop,
  onNext,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();
  const isCompact = isMobile || !isHovered;

  return (
    <div className="fixed bottom-4 right-4 z-20 pointer-events-none">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'inline-flex items-center rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 pointer-events-none',
          isCompact
            ? 'bg-black/70 border-amber-500/20 px-2 py-2'
            : 'bg-black/90 border-amber-500/20 px-4 py-3'
        )}
      >
        <button
          onClick={isPlaying ? onStop : onPlay}
          className="pointer-events-auto touch-manipulation select-none w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-black transition-all hover:scale-105 shadow-lg shadow-amber-500/30"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {!isMobile && (
          <div
            className={cn(
              'text-left overflow-hidden transition-all duration-300',
              isCompact ? 'max-w-0 opacity-0 ml-0' : 'max-w-56 opacity-100 ml-3'
            )}
          >
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3 h-3" />
              Tocando
              {isPlaying && (
                <span className="inline-flex gap-0.5 ml-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-amber-400 rounded-full animate-pulse"
                      style={{ height: `${6 + i * 2}px`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              )}
            </p>
            <p className="text-white text-sm font-medium whitespace-nowrap">{currentLouvor.title}</p>
            <p className="text-gray-500 text-xs whitespace-nowrap">{currentLouvor.artist}</p>
          </div>
        )}

        {!isMobile && (
          <button
            onClick={onNext}
            className={cn(
              'pointer-events-auto touch-manipulation select-none text-gray-500 hover:text-amber-400 transition-all rounded-lg',
              isCompact ? 'opacity-0 max-w-0 overflow-hidden p-0 ml-0' : 'opacity-100 p-2 ml-2 hover:bg-white/5'
            )}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WorshipPlayer;
