import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Pencil,
  CheckCircle2,
  FileText,
  MoreVertical,
  Eye,
  Stethoscope,
  Sparkles,
  PenSquare,
  Check,
} from 'lucide-react';
import DoctorLayout from '../components/doctor/DoctorLayout';
import PatientTimeline from '../components/doctor/PatientTimeline';
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

const DEMO_RESOLVED: ClinicalSummaryType = {
  chief_complaint: { text: 'Headache and dizziness since 2 days.' },
  hpi: {
    character: 'Headache mainly in the frontal region associated with dizziness. No vomiting. Mild nausea present.',
  },
  past_medical_history: ['Hypertension for 3 years'],
  medications: [{ name: 'Amlodipine', dosage: '5mg OD' }],
  allergies: ['No known drug allergies.'],
  family_history: [],
  personal_history: {},
  review_of_systems: {},
};

const RED_FLAGS = ['Elevated BP', 'Persistent headache'];

interface DocCard {
  id: string;
  filename: string;
  date: string;
}

const DEMO_DOCS: DocCard[] = [
  { id: 'd1', filename: 'Blood Report.pdf', date: '12 May 2024' },
  { id: 'd2', filename: 'Prescription.jpg', date: '12 May 2024' },
];

const TABS = [
  { id: 'summary', label: 'AI Summary', icon: Sparkles },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'notes', label: 'Doctor Notes', icon: PenSquare },
];

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h4 className="text-sm font-bold text-slate-700 mb-1.5">{title}</h4>
      <div className="text-sm text-slate-600">{children}</div>
    </div>
  );
}

export default function DoctorPatientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('summary');
  const isDemo = id !== 'mc12345';

  const [summary, setSummary] = useState<ClinicalSummaryType>(
    isDemo ? DEMO_RESOLVED : EMPTY_SUMMARY,
  );
  const [liveDocs, setLiveDocs] = useState<{ id: string; filename: string; date: string }[]>(
    isDemo ? DEMO_DOCS : [],
  );
  const [patient, setPatient] = useState(
    isDemo ? { name: 'Rahul Kumar', age: 42, token: 'A104' } : { name: '', age: 0, token: '' },
  );
  const [isUrgent, setIsUrgent] = useState(isDemo);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isDemo) return;
    let active = true;
    api
      .getDoctorPatient(id!)
      .then((data) => {
        if (!active) return;
        setSummary({
          ...EMPTY_SUMMARY,
          ...data.summary,
        });
        setLiveDocs(
          data.documents.map((d) => ({
            id: d.id,
            filename: d.filename || 'Document',
            date: d.date || '—',
          })),
        );
        setPatient({
          name: data.patient.name,
          age: data.patient.age,
          token: data.patient.token,
        });
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
  }, [id, isDemo]);

  const handleConfirm = async () => {
    if (isDemo) {
      setConfirmed(true);
      return;
    }
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

  const demoUsed = isDemo && summary.chief_complaint.text;

  return (
    <DoctorLayout
      title="Case Details"
      subtitle={patient.name}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {loading ? (
          <p className="text-sm text-slate-500">Loading patient...</p>
        ) : error && !confirmed ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <p className="text-sm text-rose-500 mb-4">{error}</p>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 px-5 rounded-xl"
            >
              Back to Dashboard
            </button>
          </div>
        ) : confirmed ? (
          <div className="flex flex-col items-center text-center gap-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Case confirmed</h2>
            <p className="text-sm text-slate-500 max-w-md">
              The clinical draft has been reviewed and finalized. ABDM/FHIR records updated (demo).
            </p>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-700">
                    RK
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl font-bold text-slate-800">{patient.name}</h1>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Priority
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {patient.age} / Male
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium">
                    Patient ID: MC12345
                  </span>
                  <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Token: {patient.token}
                  </span>
                </div>
              </div>
            </section>

            <section className="flex gap-1.5 border-b border-slate-200 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </section>

            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">AI-Generated Clinical Draft</p>
                    <p className="text-xs text-amber-700 mt-0.5">Review and confirm before finalizing.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard title="Chief Complaint">{summary.chief_complaint.text}</InfoCard>
                  <InfoCard title="History of Present Illness">
                    {summary.hpi.character || 'The patient is experiencing headache mainly in the frontal region associated with dizziness. No vomiting. Mild nausea present.'}
                  </InfoCard>
                  <InfoCard title="Past History">
                    {summary.past_medical_history.length > 0
                      ? summary.past_medical_history.join(', ')
                      : 'Not reported'}
                  </InfoCard>
                  <InfoCard title="Medications">
                    {summary.medications.length > 0
                      ? summary.medications.map((m) => `${m.name} ${m.dosage ?? ''}`).join(', ')
                      : 'Not reported'}
                  </InfoCard>
                  <InfoCard title="Allergies">
                    {summary.allergies.length > 0 ? summary.allergies.join(', ') : 'No known drug allergies.'}
                  </InfoCard>
                </div>

                <section className="bg-amber-50 border border-amber-300 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <h4 className="text-sm font-bold text-amber-800">Red Flags</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(RED_FLAGS).map((rf) => (
                      <span
                        key={rf}
                        className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-lg"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        {rf}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-700">Doctor Review</h4>
                    {editing && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Editing draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    The AI structures the patient history into this concise clinical draft for your
                    review. Confirm to finalize the case record.
                  </p>
                </section>

                <section className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setEditing((v) => !v)}
                    className="flex flex-1 items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-3 rounded-xl transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    {editing ? 'Done Editing' : 'Edit Case'}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="flex flex-1 items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-sm font-semibold py-3 rounded-xl shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {confirming ? 'Confirming...' : 'Confirm & Proceed'}
                  </button>
                </section>

                {demoUsed && (
                  <p className="text-xs text-slate-400 text-center">
                    Showing a representative AI-generated clinical draft for demonstration.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <section className="space-y-3">
                <p className="text-sm text-slate-500">
                  Digitized reports and prescriptions uploaded by the patient.
                </p>
                {(liveDocs.length > 0 ? liveDocs : DEMO_DOCS).map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4"
                  >
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-500">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{doc.filename}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Uploaded {doc.date}</p>
                    </div>
                    <button className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="More options">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </section>
            )}

            {activeTab === 'timeline' && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <PatientTimeline />
              </section>
            )}

            {activeTab === 'notes' && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Doctor's Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your clinical notes for this case..."
                    rows={6}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none resize-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Notes are saved per case and remain confidential.
                  </p>
                  <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-colors">
                    <Check className="w-4 h-4" />
                    Save Notes
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DoctorLayout>
  );
}
