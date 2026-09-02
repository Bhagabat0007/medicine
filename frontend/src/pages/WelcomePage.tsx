import { useNavigate } from 'react-router-dom';
import { Activity, Clock, Volume2 } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';

export default function WelcomePage() {
  const navigate = useNavigate();

  const speakInstructions = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        'Welcome to MediKiosk. This kiosk will help create your medical history for your doctor. Press start to begin.'
      );
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <KioskLayout showProgress={false}>
      <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
        <div className="bg-primary-500 p-6 rounded-3xl shadow-lg">
          <Activity className="w-16 h-16 text-white" />
        </div>

        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-navy-900 mb-3">
            MediKiosk
          </h1>
          <p className="text-xl sm:text-2xl text-navy-600">
            Your medical history.<br />
            Simplified.
          </p>
        </div>

        <button
          onClick={() => navigate('/language')}
          className="w-full max-w-xs bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-lg transition-colors min-h-[72px]"
        >
          Start
        </button>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={speakInstructions}
            className="flex items-center gap-2 text-navy-500 hover:text-primary-600 transition-colors text-lg py-3 px-6"
          >
            <Volume2 className="w-5 h-5" />
            Tap to hear instructions
          </button>
          <div className="flex items-center gap-2 text-navy-400 text-base">
            <Clock className="w-4 h-4" />
            This session usually takes 3-5 minutes
          </div>
        </div>
      </div>
    </KioskLayout>
  );
}
