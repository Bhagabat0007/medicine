import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Fingerprint, UserPlus, Minus, Plus, Pencil, Check } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';
import { useStore } from '../store/useStore';
import { api, ApiError } from '../api/client';

type View = 'options' | 'scanning' | 'found' | 'new';

export default function IdentifyPage() {
  const navigate = useNavigate();
  const startFlow = useStore((s) => s.startFlow);
  const session = useStore((s) => s.session);
  const [view, setView] = useState<View>('options');
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [foundName, setFoundName] = useState('');
  const [foundAge, setFoundAge] = useState(30);
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openScan = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setError('');
    setView('scanning');
    try {
      const result = await api.extractIdentity(file);
      setFoundName(result.extracted.name);
      setFoundAge(result.extracted.age || 30);
      setView('found');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "We couldn't read your document. Please try again or enter your details manually.",
      );
      setView('options');
    } finally {
      setExtracting(false);
    }
  };

  const handleNewPatient = () => {
    setView('new');
  };

  const handleNewPatientContinue = async () => {
    if (name.trim()) {
      try {
        await startFlow(name.trim(), age, session.language);
        navigate('/consent');
      } catch {
        setError('Could not register patient. Please check your connection and try again.');
      }
    }
  };

  const handleFoundContinue = async () => {
    try {
      await startFlow(foundName.trim() || 'Patient', foundAge, session.language);
      navigate('/consent');
    } catch {
      setError('Could not save this patient. Please try again.');
    }
  };

  if (view === 'scanning') {
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
          <div className="relative">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <Fingerprint className="w-12 h-12 text-primary-500 animate-pulse" />
            </div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-primary-400 rounded-full animate-pulse-ring" />
          </div>
          <h2 className="text-2xl font-semibold text-navy-700">
            {extracting ? 'Reading your document...' : 'Scanning...'}
          </h2>
          <p className="text-lg text-navy-500">
            {extracting ? 'We are extracting your details' : 'Please hold still'}
          </p>
        </div>
      </KioskLayout>
    );
  }

  if (view === 'found') {
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center">
            <Fingerprint className="w-10 h-10 text-success-600" />
          </div>
          <h2 className="text-3xl font-bold text-navy-900">Details found</h2>
          <p className="text-lg text-navy-500 -mt-4">
            Please confirm that these are correct.
          </p>

          <div className="bg-white rounded-2xl border border-navy-200 p-6 w-full shadow-sm text-left">
            <label className="block text-lg font-medium text-navy-700 mb-2">Name</label>
            <div className="flex items-center gap-2 mb-5">
              <input
                type="text"
                value={foundName}
                onChange={(e) => setFoundName(e.target.value)}
                className="flex-1 border-2 border-navy-200 rounded-2xl px-5 py-3 text-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
              <Pencil className="w-5 h-5 text-navy-400" />
            </div>

            <label className="block text-lg font-medium text-navy-700 mb-2">Age</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFoundAge(Math.max(1, foundAge - 1))}
                className="bg-navy-200 hover:bg-navy-300 w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
              >
                <Minus className="w-6 h-6 text-navy-700" />
              </button>
              <span className="text-4xl font-bold text-navy-800 w-20 text-center">{foundAge}</span>
              <button
                onClick={() => setFoundAge(Math.min(120, foundAge + 1))}
                className="bg-navy-200 hover:bg-navy-300 w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-6 h-6 text-navy-700" />
              </button>
            </div>
          </div>

          {error && <p className="text-danger-500 text-base">{error}</p>}

          <div className="flex gap-3 w-full">
            <button
              onClick={openScan}
              className="flex-1 border-2 border-navy-200 text-navy-700 text-lg font-semibold py-4 rounded-2xl hover:bg-navy-50 min-h-[64px]"
            >
              Retake
            </button>
            <button
              onClick={handleFoundContinue}
              disabled={!foundName.trim()}
              className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 text-white text-lg font-bold py-4 rounded-2xl min-h-[64px] flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Confirm
            </button>
          </div>
        </div>
      </KioskLayout>
    );
  }

  if (view === 'new') {
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
          <div className="bg-primary-100 p-4 rounded-2xl">
            <UserPlus className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-navy-900">Enter your details</h2>

          <div className="w-full text-left">
            <label className="block text-lg font-medium text-navy-700 mb-2">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border-2 border-navy-200 rounded-2xl px-5 py-4 text-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="w-full text-left">
            <label className="block text-lg font-medium text-navy-700 mb-2">Age</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAge(Math.max(1, age - 1))}
                className="bg-navy-200 hover:bg-navy-300 w-14 h-14 rounded-xl flex items-center justify-center transition-colors"
              >
                <Minus className="w-6 h-6 text-navy-700" />
              </button>
              <span className="text-4xl font-bold text-navy-800 w-20 text-center">{age}</span>
              <button
                onClick={() => setAge(Math.min(120, age + 1))}
                className="bg-navy-200 hover:bg-navy-300 w-14 h-14 rounded-xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-6 h-6 text-navy-700" />
              </button>
            </div>
          </div>

          <button
            onClick={handleNewPatientContinue}
            disabled={!name.trim()}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 disabled:cursor-not-allowed text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-lg transition-colors min-h-[72px]"
          >
            Continue
          </button>

          {error && <p className="text-danger-500 text-base">{error}</p>}
        </div>
      </KioskLayout>
    );
  }

  // Default: options view
  return (
    <KioskLayout>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">
          How would you like to continue?
        </h2>

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={openScan}
            className="w-full bg-white border-2 border-navy-200 hover:border-primary-500 hover:bg-primary-50 text-navy-800 text-xl font-semibold py-5 px-8 rounded-2xl transition-all min-h-[72px] shadow-sm flex items-center justify-center gap-3"
          >
            <CreditCard className="w-6 h-6 text-primary-500" />
            Scan ABHA
          </button>

          <button
            onClick={openScan}
            className="w-full bg-white border-2 border-navy-200 hover:border-primary-500 hover:bg-primary-50 text-navy-800 text-xl font-semibold py-5 px-8 rounded-2xl transition-all min-h-[72px] shadow-sm flex items-center justify-center gap-3"
          >
            <Fingerprint className="w-6 h-6 text-primary-500" />
            Scan Aadhaar
          </button>

          <button
            onClick={handleNewPatient}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white text-xl font-semibold py-5 px-8 rounded-2xl transition-all min-h-[72px] shadow-md flex items-center justify-center gap-3"
          >
            <UserPlus className="w-6 h-6" />
            New Patient
          </button>

          {error && <p className="text-danger-500 text-base">{error}</p>}
        </div>
      </div>
    </KioskLayout>
  );
}
