import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, User, ChevronRight, Stethoscope } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { DoctorPatient } from '../types';

const MOCK_QUEUE: DoctorPatient[] = [
  {
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
      { id: 'd1', name: 'Previous Prescription', type: 'prescription', date: '2026-08-12', medicines: [{ name: 'Amlodipine 5mg' }, { name: 'Aspirin 75mg' }], processed: true },
    ],
  },
  {
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
  {
    token: 'A106',
    patientId: 'p3',
    name: 'Sita Devi',
    age: 67,
    priority: 'normal',
    status: 'IN_PROGRESS',
    documents: [],
  },
];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { setCurrentStep } = useStore();

  return (
    <div className="min-h-screen bg-navy-50">
      <header className="bg-white border-b border-navy-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 p-2 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-800">MediKiosk</h1>
              <p className="text-sm text-navy-500">Doctor Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-navy-600">
            <Stethoscope className="w-5 h-5" />
            <span className="text-base font-medium">Dr. Admin</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-navy-900">Patient Queue</h2>
          <span className="bg-primary-100 text-primary-700 text-base font-medium px-4 py-2 rounded-full">
            {MOCK_QUEUE.filter((p) => p.status === 'SUMMARY_READY').length} ready
          </span>
        </div>

        <div className="space-y-4">
          {MOCK_QUEUE.map((patient) => (
            <button
              key={patient.patientId}
              onClick={() => {
                setCurrentStep(6);
                navigate(`/doctor/patient/${patient.patientId}`);
              }}
              className="w-full bg-white rounded-2xl border border-navy-200 p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition-all text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    patient.priority === 'urgent' ? 'bg-danger-100' : 'bg-navy-100'
                  }`}
                >
                  {patient.priority === 'urgent' ? (
                    <AlertTriangle className="w-6 h-6 text-danger-500" />
                  ) : (
                    <User className="w-6 h-6 text-navy-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-navy-800">{patient.name}</h3>
                    {patient.priority === 'urgent' && (
                      <span className="bg-danger-100 text-danger-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        URGENT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-navy-500 mt-1">
                    <span>Age: {patient.age}</span>
                    <span>Token: {patient.token}</span>
                    <span className={`font-medium ${
                      patient.status === 'SUMMARY_READY' ? 'text-success-600' : 'text-warning-600'
                    }`}>
                      {patient.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-navy-400" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
