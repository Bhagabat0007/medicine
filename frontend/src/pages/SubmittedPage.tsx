import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ExternalLink } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';
import { useStore } from '../store/useStore';

const INTEGRATION_STEPS = [
  'Clinical history saved',
  'Doctor summary generated',
  'ABHA record updated',
  'Hospital system notified',
];

export default function SubmittedPage() {
  const navigate = useNavigate();
  const { resetSession } = useStore();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    INTEGRATION_STEPS.forEach((_, index) => {
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, index]);
      }, (index + 1) * 800);
    });
  }, []);

  const handleNewPatient = () => {
    resetSession();
    navigate('/welcome');
  };

  const allDone = completedSteps.length === INTEGRATION_STEPS.length;

  return (
    <KioskLayout showProgress={false}>
      <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-8">
        {allDone ? (
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-success-600" />
          </div>
        ) : (
          <div className="text-4xl">📄</div>
        )}

        <h2 className="text-3xl font-bold text-navy-900">
          {allDone ? 'All done!' : 'Saving your information...'}
        </h2>

        <div className="w-full bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
          <p className="text-sm text-navy-400 uppercase tracking-wide mb-4 font-medium">
            ABDM/FHIR Integration — DEMO
          </p>
          <div className="space-y-4">
            {INTEGRATION_STEPS.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                {completedSteps.includes(index) ? (
                  <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-navy-300 rounded-full flex-shrink-0" />
                )}
                <span
                  className={`text-lg ${
                    completedSteps.includes(index) ? 'text-navy-800 font-medium' : 'text-navy-400'
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {allDone && (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-lg min-h-[72px] flex items-center justify-center gap-3"
            >
              <ExternalLink className="w-5 h-5" />
              View Doctor Dashboard
            </button>
            <button
              onClick={handleNewPatient}
              className="w-full bg-navy-200 hover:bg-navy-300 text-navy-700 text-lg font-semibold py-4 px-8 rounded-2xl min-h-[64px]"
            >
              New Patient
            </button>
          </div>
        )}
      </div>
    </KioskLayout>
  );
}
