import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic } from 'lucide-react';
import DoctorLayout from '../components/doctor/DoctorLayout';

export default function VoiceInputPage() {
  const navigate = useNavigate();
  const [listening, setListening] = useState(true);

  const barHeights = [14, 26, 18, 30, 22, 32, 20, 27, 16];

  return (
    <DoctorLayout
      title="Voice Input"
      subtitle="AI clinical history assistant"
    >
      <div className="max-w-lg mx-auto flex flex-col items-center text-center gap-6">
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="self-start flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <p className="text-sm text-slate-500">
          The AI listens as the patient describes their symptoms in their own words.
        </p>

        <div className="relative mt-2">
          <button
            onClick={() => setListening((v) => !v)}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl ${
              listening
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                : 'bg-slate-200 hover:bg-slate-300 shadow-slate-200'
            }`}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
          >
            {listening && (
              <>
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring" />
                <span
                  className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring"
                  style={{ animationDelay: '0.5s' }}
                />
              </>
            )}
            <span className="relative z-10 flex flex-col items-center">
              <Mic className={`w-10 h-10 ${listening ? 'text-white' : 'text-slate-500'}`} />
            </span>
          </button>
        </div>

        <div>
          <p className="text-lg font-bold text-slate-800">
            {listening ? 'Listening…' : 'Tap to listen'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {listening ? 'Tap mic to stop' : 'Press the mic to begin'}
          </p>
        </div>

        <div className="flex items-end gap-1.5 h-12">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full ${
                listening ? 'bg-emerald-400' : 'bg-slate-200'
              }`}
              style={{
                height: `${listening ? h : 8}px`,
                animation: listening
                  ? `pulse-dot 1s ease-in-out ${i * 0.08}s infinite alternate`
                  : 'none',
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-2">
          {['Speaks', 'AI structures', 'Summary ready'].map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center"
            >
              <div className="w-7 h-7 mx-auto mb-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <p className="text-xs font-semibold text-slate-600">{step}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          Audio is transcribed and structured into a clinical draft for doctor review.
        </p>
      </div>
    </DoctorLayout>
  );
}
