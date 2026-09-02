import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, User, ChevronRight, Stethoscope } from 'lucide-react';
import { api, ApiError } from '../api/client';

interface QueueItem {
  token: string;
  patientId: string;
  name: string;
  age: number;
  priority: 'normal' | 'urgent';
  status: string;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getDoctorQueue()
      .then((entries) => {
        if (!active) return;
        setQueue(
          entries.map((e) => ({
            token: e.token,
            patientId: e.patient_id,
            name: e.patient_name,
            age: e.age,
            priority: e.priority === 'URGENT' ? 'urgent' : 'normal',
            status: e.status,
          })),
        );
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof ApiError ? e.message : 'Could not load the patient queue.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const readyCount = queue.filter((p) => p.status === 'SUMMARY_READY').length;

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
            {readyCount} ready
          </span>
        </div>

        {loading && <p className="text-lg text-navy-500">Loading queue...</p>}

        {error && !loading && <p className="text-lg text-danger-500">{error}</p>}

        {!loading && !error && (
          <div className="space-y-4">
            {queue.length === 0 && (
              <div className="bg-white rounded-2xl border border-navy-200 p-8 text-center shadow-sm">
                <p className="text-lg text-navy-500">No patients in the queue yet.</p>
              </div>
            )}
            {queue.map((patient) => (
              <button
                key={patient.patientId}
                onClick={() => navigate(`/doctor/patient/${patient.patientId}`)}
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
        )}
      </main>
    </div>
  );
}
