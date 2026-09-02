import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
  isListening: boolean;
  onToggle: () => void;
  size?: 'md' | 'lg';
}

export default function VoiceButton({ isListening, onToggle, size = 'lg' }: VoiceButtonProps) {
  const sizeClasses = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const iconSize = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';

  return (
    <button
      onClick={onToggle}
      className={`relative ${sizeClasses} rounded-full flex items-center justify-center transition-all ${
        isListening
          ? 'bg-danger-500 hover:bg-danger-600 shadow-lg shadow-danger-200'
          : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-200'
      }`}
    >
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-danger-400 animate-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-danger-400 animate-pulse-ring" style={{ animationDelay: '0.4s' }} />
        </>
      )}
      <span className="relative z-10 animate-pulse-dot">
        {isListening ? (
          <MicOff className={`${iconSize} text-white`} />
        ) : (
          <Mic className={`${iconSize} text-white`} />
        )}
      </span>
    </button>
  );
}
