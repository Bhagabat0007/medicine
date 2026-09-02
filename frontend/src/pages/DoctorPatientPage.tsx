import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, Check, Send } from 'lucide-react';
import ClinicalSummary from '../components/doctor/ClinicalSummary';
import { api, ApiError } from '../api/client';
import type { ClinicalSummary as ClinicalSummaryType } from '../types';

const EMPTY_SUMMARY: ClinicalSummaryType = {
  chief_complaint: { text: 'Not available' },
  hpi: {},
  past_medical_history: [],
  medications: [],
  allergies: [],
  family_history: [],
  personal_history: {},
  review_of_systems: {},
};

interface DocumentRow {
  id: string;
  name: string;
  date: string;
}

export default function DoctorPatientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<ClinicalSummaryType>(EMPTY_SUMMARY);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [token, setToken] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    api
      .getDoctorPatient(id)
      .then((data) => {
        if (!active) return;
        setSummary(data.summary);
        setDocuments(
          data.documents.map((d) => ({ id: d.id, name: d.filename || 'Document', date: d.date || '' })),
        );
        setPatientName(data.patient.name);
        setAge(data.patient.age);
        setToken(data.patient.token);
        setIsUrgent(data.priority === 'URGENT');
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof ApiError ? e.message : 'Could not load this patient.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    setConfirming(true);
    try {
      await api.confirmDoctorSummary(id);
      setConfirmed(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not confirm the summary.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <p className="text-lg text-navy-500">Loading patient...</p>
      </div>
    );
  }

  if (error && !confirmed) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg text-danger-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="bg-primary-500 hover:bg-primary-600 text-white text-lg font-bold py-4 px-8 rounded-2xl min-h-[64px]"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-navy-900">{patientName}</h1>
                {isUrgent && (
                  <span className="bg-danger-100 text-danger-600 text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Priority
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-base text-navy-500 mt-1">
                <span>Age: {age ?? '—'}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Token: {token}
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

            {documents.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-navy-700 mb-3">Uploaded Documents</h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between">
                      <span className="text-base text-navy-600">{doc.name}</span>
                      <span className="text-sm text-navy-400">{doc.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-danger-500 text-base mt-4">{error}</p>}

            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full mt-6 bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-lg min-h-[72px] flex items-center justify-center gap-3"
            >
              <Send className="w-6 h-6" />
              {confirming ? 'Confirming...' : 'Confirm & Continue'}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
