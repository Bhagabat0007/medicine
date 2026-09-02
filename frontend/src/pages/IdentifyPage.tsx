import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Fingerprint, UserPlus, Minus, Plus } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';
import { useStore } from '../store/useStore';

type View = 'options' | 'scanning' | 'found' | 'new';

const MOCK_PATIENTS = [
  { name: 'Rajesh Kumar', age: 54 },
  { name: 'Priya Patel', age: 42 },
  { name: 'Sita Devi', age: 67 },
];

export default function IdentifyPage() {
  const navigate = useNavigate();
  const setPatientInfo = useStore((s) => s.setPatientInfo);
  const [view, setView] = useState<View>('options');
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [foundPatient, setFoundPatient] = useState(MOCK_PATIENTS[0]);

  const handleScan = () => {
    setView('scanning');
    setTimeout(() => {
      const patient = MOCK_PATIENTS[Math.floor(Math.random() * MOCK_PATIENTS.length)];
      setFoundPatient(patient);
      setPatientInfo(patient.name, patient.age);
      setView('found');
    }, 2000);
  };

  const handleNewPatient = () => {
    setView('new');
  };

  const handleNewPatientContinue = () => {
    if (name.trim()) {
      setPatientInfo(name.trim(), age);
      navigate('/consent');
    }
  };

  const handleFoundContinue = () => {
    navigate('/consent');
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
          <h2 className="text-2xl font-semibold text-navy-700">Scanning...</h2>
          <p className="text-lg text-navy-500">Please hold still</p>
        </div>
      </KioskLayout>
    );
  }

  if (view === 'found') {
    const patient = foundPatient;
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center">
            <Fingerprint className="w-10 h-10 text-success-600" />
          </div>
          <h2 className="text-3xl font-bold text-navy-900">Patient found</h2>
          <div className="bg-white rounded-2xl border border-navy-200 p-6 w-full shadow-sm">
            <p className="text-lg text-navy-500 mb-1">Name</p>
            <p className="text-2xl font-bold text-navy-800">{patient.name}</p>
            <div className="my-4 border-t border-navy-200" />
            <p className="text-lg text-navy-500 mb-1">Age</p>
            <p className="text-2xl font-bold text-navy-800">{patient.age} years</p>
          </div>
          <button
            onClick={handleFoundContinue}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-lg min-h-[72px]"
          >
            Continue
          </button>
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
        </div>
      </KioskLayout>
    );
  }

  // Default: options view
  return (
    <KioskLayout>
      <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy-900">
          How would you like to continue?
        </h2>

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={handleScan}
            className="w-full bg-white border-2 border-navy-200 hover:border-primary-500 hover:bg-primary-50 text-navy-800 text-xl font-semibold py-5 px-8 rounded-2xl transition-all min-h-[72px] shadow-sm flex items-center justify-center gap-3"
          >
            <CreditCard className="w-6 h-6 text-primary-500" />
            Scan ABHA
          </button>

          <button
            onClick={handleScan}
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
        </div>
      </div>
    </KioskLayout>
  );
}
