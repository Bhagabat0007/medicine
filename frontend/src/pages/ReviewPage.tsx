import { useNavigate } from 'react-router-dom';
import { User, FileText, AlertCircle, Pill, Edit3, Send, Check } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';
import { useStore } from '../store/useStore';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { session, setCurrentStep, setSubmitting } = useStore();

  const handleSubmit = () => {
    setSubmitting(true);
    setCurrentStep(6);
    // Mock generating summary
    setTimeout(() => {
      useStore.getState().setSummary({
        chief_complaint: { text: session.symptoms[0]?.name || 'General consultation' },
        hpi: {
          onset: 'Recent',
          severity: session.symptoms[0]?.severity,
          character: 'Not specified',
          associated_symptoms: session.symptoms.slice(1).map((s) => s.name),
        },
        past_medical_history: [],
        medications: session.documents.flatMap((d) => d.medicines || []),
        allergies: [],
        family_history: [],
        personal_history: {},
        review_of_systems: {},
      });
      setSubmitting(false);
      navigate('/submitted');
    }, 2000);
  };

  if (session.isSubmitting) {
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-6">
          <div className="text-4xl">🤖</div>
          <h2 className="text-2xl font-bold text-navy-800">Creating your doctor's summary...</h2>
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center gap-3 text-success-600">
              <Check className="w-5 h-5" />
              <span className="text-lg">Reviewing symptoms</span>
            </div>
            <div className="flex items-center gap-3 text-success-600">
              <Check className="w-5 h-5" />
              <span className="text-lg">Organizing medical history</span>
            </div>
            <div className="flex items-center gap-3 text-navy-400 animate-pulse">
              <div className="w-5 h-5 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
              <span className="text-lg">Preparing summary</span>
            </div>
          </div>
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout>
      <div className="flex flex-col items-center max-w-lg mx-auto gap-6 w-full">
        <h2 className="text-3xl font-bold text-navy-900 text-center">Your Information</h2>

        <div className="w-full space-y-4">
          {/* Patient Info */}
          <div className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-navy-700">Patient</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-navy-500">Name</p>
                <p className="text-lg font-medium text-navy-800">{session.name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-navy-500">Age</p>
                <p className="text-lg font-medium text-navy-800">{session.age || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-navy-700">Main problem</h3>
            </div>
            {session.symptoms.length > 0 ? (
              <div className="space-y-2">
                {session.symptoms.map((symptom) => (
                  <div key={symptom.id} className="flex justify-between items-center">
                    <p className="text-lg text-navy-800">{symptom.name}</p>
                    {symptom.severity !== undefined && (
                      <span className="text-base text-navy-500">{symptom.severity}/10</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg text-navy-500">No symptoms recorded</p>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-navy-700">Documents</h3>
            </div>
            {session.documents.length > 0 ? (
              <div className="space-y-2">
                {session.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary-500" />
                    <span className="text-lg text-navy-700">
                      {doc.name} - {doc.date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-lg text-navy-500">No documents uploaded</p>
            )}
          </div>

          {/* Conversation summary */}
          <div className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-navy-700">Conversation</h3>
            </div>
            <p className="text-base text-navy-500">
              {session.conversation.filter((m) => m.role === 'patient').length} responses recorded
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full mt-4">
          <button
            onClick={() => navigate('/intake')}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-navy-200 text-navy-700 text-lg font-semibold py-4 rounded-2xl hover:bg-navy-50 min-h-[64px]"
          >
            <Edit3 className="w-5 h-5" />
            Edit
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-lg font-bold py-4 rounded-2xl min-h-[64px]"
          >
            <Send className="w-5 h-5" />
            Submit
          </button>
        </div>
      </div>
    </KioskLayout>
  );
}
