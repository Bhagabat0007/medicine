import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Volume2 } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';
import { useStore } from '../store/useStore';

export default function ConsentPage() {
  const navigate = useNavigate();
  const { confirmConsent, setCurrentStep } = useStore();
  const [agreed, setAgreed] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const speakConsent = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        'Before we begin, MediKiosk will ask about your health and create a summary for your doctor. Your information will only be used for your hospital visit.'
      );
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleContinue = async () => {
    if (agreed) {
      setSubmitting(true);
      setError('');
      try {
        await confirmConsent(true);
        setCurrentStep(3);
        navigate('/intake');
      } catch {
        setError('Could not save your consent. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <KioskLayout>
      <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
        <div className="bg-primary-100 p-4 rounded-2xl">
          <Shield className="w-10 h-10 text-primary-600" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">
          Before we begin
        </h2>

        <div className="bg-white rounded-2xl border border-navy-200 p-6 w-full shadow-sm text-left">
          <p className="text-lg text-navy-700 leading-relaxed">
            MediKiosk will ask about your health and create a summary for your doctor.
          </p>
          <p className="text-lg text-navy-700 leading-relaxed mt-3">
            Your information will only be used for your hospital visit.
          </p>
        </div>

        <button
          onClick={speakConsent}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-lg py-3 px-6"
        >
          <Volume2 className="w-5 h-5" />
          Listen
        </button>

        <label className="flex items-center gap-3 cursor-pointer py-3 px-6">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-6 h-6 rounded border-navy-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-lg text-navy-700">I understand and agree</span>
        </label>

        <button
          onClick={handleContinue}
          disabled={!agreed || submitting}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 disabled:cursor-not-allowed text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-lg transition-colors min-h-[72px]"
        >
          {submitting ? 'Saving...' : 'Continue'}
        </button>

        {error && <p className="text-danger-500 text-base">{error}</p>}

        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="text-primary-600 hover:text-primary-700 text-base underline"
        >
          {showPrivacy ? 'Hide privacy details' : 'View privacy details →'}
        </button>

        {showPrivacy && (
          <div className="bg-white rounded-2xl border border-navy-200 p-6 w-full shadow-sm text-left">
            <h3 className="text-lg font-semibold text-navy-800 mb-3">Privacy Details</h3>
            <ul className="space-y-2 text-navy-600 text-base">
              <li>• Your data is used only for this hospital visit</li>
              <li>• Information is shared only with your doctor</li>
              <li>• Session data is automatically deleted after submission</li>
              <li>• We comply with the Digital Personal Data Protection Act 2023</li>
              <li>• No data is sold or used for research without explicit consent</li>
            </ul>
          </div>
        )}
      </div>
    </KioskLayout>
  );
}
