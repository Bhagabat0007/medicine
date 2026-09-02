import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, Check, Send } from 'lucide-react';
import ClinicalSummary from '../components/doctor/ClinicalSummary';
import { useStore } from '../store/useStore';
import type { ClinicalSummary as ClinicalSummaryType, DoctorPatient } from '../types';

const MOCK_PATIENTS: Record<string, DoctorPatient> = {
  p1: {
    token: 'A104',
    patientId: 'p1',
    name: 'Rajesh Kumar',
    age: 54,
    priority: 'urgent',
    status: 'SUMMARY_READY',
    summary: {
      chief_complaint: { text: 'Chest pain since yesterday' },
      hpi: {
        onset: 'Yesterday',
        severity: 7,
        character: 'Pressure-like',
        associated_symptoms: ['Breathlessness'],
      },
      past_medical_history: ['Hypertension - 5 years'],
      medications: [{ name: 'Amlodipine 5mg' }, { name: 'Aspirin 75mg' }],
      allergies: ['Penicillin'],
      family_history: ['Father - Heart disease'],
      personal_history: { smoking: 'Ex-smoker', alcohol: 'Occasional' },
      review_of_systems: {},
    },
    documents: [
      { id: 'd1', name: 'Previous Prescription', type: 'prescription', date: '12 Aug 2026', medicines: [{ name: 'Amlodipine 5mg' }, { name: 'Aspirin 75mg' }], processed: true },
    ],
  },
  p2: {
    token: 'A105',
    patientId: 'p2',
    name: 'Priya Patel',
    age: 42,
    priority: 'normal',
    status: 'SUMMARY_READY',
    summary: {
      chief_complaint: { text: 'Persistent headaches for 3 days' },
      hpi: { onset: '3 days ago', severity: 5, character: 'Throbbing', location: 'Forehead' },
      past_medical_history: [],
      medications: [],
      allergies: [],
      family_history: [],
      personal_history: {},
      review_of_systems: {},
    },
    documents: [],
  },
};

export default function DoctorPatientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCurrentStep } = useStore();
  const patient = MOCK_PATIENTS[id || 'p1'] || MOCK_PATIENTS.p1;

  const [summary, setSummary] = useState<ClinicalSummaryType>(
    patient.summary || {
      chief_complaint: { text: 'Not available' },
      hpi: {},
      past_medical_history: [],
      medications: [],
      allergies: [],
      family_history: [],
      personal_history: {},
      review_of_systems: {},
    }
  );

  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    setCurrentStep(6);
  };

  return (
    <div className="min-h-screen bg-navy-50">
      <header className="bg-white border-b border-navy-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center gap-2 text-navy-600 hover:text-primary-600 mb-3 text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to queue
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-navy-900">{patient.name}</h1>
                {patient.priority === 'urgent' && (
                  <span className="bg-danger-100 text-danger-600 text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Priority
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-base text-navy-500 mt-1">
                <span>Age: {patient.age}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Token: {patient.token}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {confirmed ? (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-success-600" />
            </div>
            <h2 className="text-3xl font-bold text-navy-900">Summary confirmed</h2>
            <p className="text-lg text-navy-500">
              The clinical summary has been finalized and saved.
            </p>
            <div className="bg-white rounded-2xl border border-navy-200 p-6 w-full max-w-md shadow-sm">
              <p className="text-sm text-navy-400 uppercase tracking-wide mb-3 font-medium">
                ABDM/FHIR Integration — DEMO
              </p>
              <div className="space-y-2 text-left">
                {['Clinical summary saved', 'ABHA record updated', 'HIS notified'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success-500" />
                    <span className="text-base text-navy-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="bg-primary-500 hover:bg-primary-600 text-white text-lg font-bold py-4 px-8 rounded-2xl min-h-[64px]"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <ClinicalSummary summary={summary} onSummaryChange={setSummary} />

            {patient.documents.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-navy-700 mb-3">Uploaded Documents</h3>
                <div className="space-y-2">
                  {patient.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between">
                      <span className="text-base text-navy-600">{doc.name}</span>
                      <span className="text-sm text-navy-400">{doc.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleConfirm}
              className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-lg min-h-[72px] flex items-center justify-center gap-3"
            >
              <Send className="w-6 h-6" />
              Confirm & Continue
            </button>
          </>
        )}
      </main>
    </div>
  );
}
