import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, FileText, Check } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';
import { useStore } from '../store/useStore';

type ViewState = 'upload' | 'processing' | 'result';

interface DocResult {
  name: string;
  date: string;
  medicines: { name: string; dosage?: string }[];
  diagnoses: string[];
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { submitDocument, addDocument, setCurrentStep } = useStore();
  const [view, setView] = useState<ViewState>('upload');
  const [currentDoc, setCurrentDoc] = useState<DocResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const processDocument = async (file: File) => {
    setView('processing');
    setError('');
    try {
      const doc = await submitDocument(file);
      const mapped = {
        name: doc.filename || 'Document',
        date: doc.date || 'Today',
        medicines: doc.medicines ?? [],
        diagnoses: doc.diagnoses ?? [],
      };
      setCurrentDoc(mapped);
      addDocument({ id: doc.id, name: mapped.name, type: doc.document_type || 'document', date: mapped.date, medicines: mapped.medicines, diagnoses: mapped.diagnoses, processed: true });
      setView('result');
    } catch {
      setView('upload');
      setError("We couldn't read this document. Please try another photo.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processDocument(file);
    }
  };

  const handleContinue = () => {
    setCurrentStep(5);
    navigate('/review');
  };

  if (view === 'processing') {
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-6">
          <div className="text-4xl">📄</div>
          <h2 className="text-2xl font-bold text-navy-800">Reading your document...</h2>
          <p className="text-lg text-navy-500">This may take a few seconds</p>
          <div className="w-full max-w-sm flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-primary-400 rounded-full typing-dot-1" />
            <span className="w-3 h-3 bg-primary-400 rounded-full typing-dot-2" />
            <span className="w-3 h-3 bg-primary-400 rounded-full typing-dot-3" />
          </div>
        </div>
      </KioskLayout>
    );
  }

  if (view === 'result' && currentDoc) {
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-6">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy-800">Document processed</h2>

          <div className="bg-white rounded-2xl border border-navy-200 p-6 w-full shadow-sm text-left">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary-500" />
              <div>
                <p className="text-lg font-semibold text-navy-800">{currentDoc.name}</p>
                <p className="text-base text-navy-500">{currentDoc.date}</p>
              </div>
            </div>

            {currentDoc.medicines.length > 0 && (
              <div className="mt-4">
                <p className="text-base font-medium text-navy-600 mb-2">Medicines detected:</p>
                <ul className="space-y-1">
                  {currentDoc.medicines.map((med, i) => (
                    <li key={i} className="text-navy-700 text-base">
                      • {med.name} {med.dosage && `- ${med.dosage}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {currentDoc.diagnoses && currentDoc.diagnoses.length > 0 && (
              <div className="mt-4">
                <p className="text-base font-medium text-navy-600 mb-2">Detected:</p>
                <ul className="space-y-1">
                  {currentDoc.diagnoses.map((d, i) => (
                    <li key={i} className="text-navy-700 text-base">• {d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setView('upload')}
              className="flex-1 border-2 border-navy-200 text-navy-700 text-lg font-semibold py-4 rounded-2xl hover:bg-navy-50 min-h-[64px]"
            >
              Add another
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-lg font-semibold py-4 rounded-2xl min-h-[64px]"
            >
              Continue
            </button>
          </div>
        </div>
      </KioskLayout>
    );
  }

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
        <h2 className="text-3xl font-bold text-navy-900">
          Do you have previous medical reports?
        </h2>
        <p className="text-lg text-navy-500">
          You can upload prescriptions, lab reports or discharge summaries.
        </p>

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={handleUpload}
            className="w-full bg-white border-2 border-navy-200 hover:border-primary-500 hover:bg-primary-50 text-navy-800 text-xl font-semibold py-5 px-8 rounded-2xl transition-all min-h-[72px] flex items-center justify-center gap-3"
          >
            <Camera className="w-6 h-6 text-primary-500" />
            Scan Document
          </button>

          <button
            onClick={handleUpload}
            className="w-full bg-white border-2 border-navy-200 hover:border-primary-500 hover:bg-primary-50 text-navy-800 text-xl font-semibold py-5 px-8 rounded-2xl transition-all min-h-[72px] flex items-center justify-center gap-3"
          >
            <Upload className="w-6 h-6 text-primary-500" />
            Upload Document
          </button>

          {error && <p className="text-danger-500 text-base">{error}</p>}

          <button
            onClick={handleContinue}
            className="w-full bg-navy-200 hover:bg-navy-300 text-navy-700 text-xl font-semibold py-5 px-8 rounded-2xl transition-all min-h-[72px]"
          >
            Skip
          </button>
        </div>
      </div>
    </KioskLayout>
  );
}
