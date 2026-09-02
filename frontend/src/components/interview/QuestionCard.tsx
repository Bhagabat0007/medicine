import { Volume2, Bot } from 'lucide-react';

interface QuestionCardProps {
  text: string;
  subtext?: string;
  onListen?: () => void;
}

export default function QuestionCard({ text, subtext, onListen }: QuestionCardProps) {
  const speak = () => {
    if (onListen) {
      onListen();
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-4 w-full">
      <div className="bg-primary-100 p-3 rounded-full">
        <Bot className="w-8 h-8 text-primary-600" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 leading-snug">
        {text}
      </h2>
      {subtext && (
        <p className="text-lg text-navy-500">{subtext}</p>
      )}
      <button
        onClick={speak}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-base py-2 px-4"
      >
        <Volume2 className="w-4 h-4" />
        Listen
      </button>
    </div>
  );
}
