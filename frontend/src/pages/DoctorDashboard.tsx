import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  FileCheck2,
  FileUp,
  Mic,
} from 'lucide-react';
import DoctorLayout from '../components/doctor/DoctorLayout';
import { api } from '../api/client';
import type { SystemCapabilities } from '../api/client';

interface QueueItem {
  token: string;
  patientId: string;
  name: string;
  age: number;
  gender?: string;
  priority: 'normal' | 'urgent';
  status: string;
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  Pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Priority: { label: 'Priority', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

interface CaseRow {
  name: string;
  age: number;
  complaint: string;
  status: 'Pending' | 'Completed' | 'Priority';
  priority: 'Normal' | 'High';
  time: string;
}

const DEMO_CASES: CaseRow[] = [
  { name: 'Rahul Kumar', age: 42, complaint: 'Headache, Dizziness', status: 'Pending', priority: 'High', time: '10:30 AM' },
  { name: 'Priya Sharma', age: 25, complaint: 'Fever', status: 'Pending', priority: 'Normal', time: '10:15 AM' },
  { name: 'Amit Das', age: 51, complaint: 'Diabetes Follow-up', status: 'Completed', priority: 'Normal', time: '09:45 AM' },
  { name: 'Sunita Patra', age: 38, complaint: 'Joint Pain', status: 'Pending', priority: 'Normal', time: '09:30 AM' },
];

const RECENT_ACTIVITY = [
  { icon: UserPlus, color: 'text-emerald-600 bg-emerald-50', text: 'New case added for Rahul Kumar', time: '10:30 AM' },
  { icon: FileCheck2, color: 'text-slate-600 bg-slate-100', text: 'Case completed for Amit Das', time: '09:45 AM' },
  { icon: FileUp, color: 'text-blue-600 bg-blue-50', text: 'Document uploaded for Priya Sharma', time: '09:20 AM' },
];

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [caps, setCaps] = useState<SystemCapabilities | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getCapabilities()
      .then((c) => {
        if (active) setCaps(c);
      })
      .catch(() => {
        /* non-fatal */
      });
    return () => {
      active = false;
    };
  }, []);

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
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const liveCases = queue.map((p) => {
    const isUrgent = p.priority === 'urgent';
    const isDone = p.status === 'COMPLETED';
    return {
      name: p.name,
      age: p.age,
      complaint: isUrgent ? 'Red-flag symptoms' : 'Consultation',
      status: isUrgent ? 'Priority' : isDone ? 'Completed' : 'Pending',
      priority: isUrgent ? 'High' : 'Normal',
      time: '—',
      patientId: p.patientId,
    };
  });

  // Reflect real queue data when present; fall back to the spec's polished
  // demo numbers only when the queue is genuinely empty.
  const hasData = queue.length > 0;
  const stats = hasData
    ? {
        total: queue.length,
        pending: queue.filter((p) => p.status !== 'COMPLETED').length,
        completed: queue.filter((p) => p.status === 'COMPLETED').length,
        priority: queue.filter((p) => p.priority === 'urgent').length,
      }
    : { total: 124, pending: 32, completed: 92, priority: 10 };

  const priorityPatient = queue.find((p) => p.priority === 'urgent');

  const casesToShow = hasData ? liveCases.slice(0, 4) : DEMO_CASES;

  return (
    <DoctorLayout
      title="Doctor Dashboard"
      subtitle="Good morning, Doctor"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="lg:hidden">
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">Doctor Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Good morning, Doctor</p>
        </section>

        {caps && (
          <section className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { label: 'AI', mode: caps.llm.mode },
              { label: 'OCR', mode: caps.ocr.mode },
              { label: 'FHIR', mode: caps.fhir.mode },
              { label: 'Data', mode: caps.persistence.enabled ? 'persistent' : 'ephemeral' },
            ].map((s) => {
              const live = s.mode === 'live' || s.mode === 'persistent';
              return (
                <span
                  key={s.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold ${
                    live
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {s.label}: {s.mode}
                </span>
              );
            })}
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Patients" value={String(stats.total)} accent="bg-emerald-50 text-emerald-600" />
          <StatCard icon={ClipboardList} label="Pending Cases" value={String(stats.pending)} accent="bg-amber-50 text-amber-600" />
          <StatCard icon={CheckCircle2} label="Completed Cases" value={String(stats.completed)} accent="bg-blue-50 text-blue-600" />
          <StatCard icon={AlertTriangle} label="Priority Cases" value={String(stats.priority)} accent="bg-rose-50 text-rose-600" />
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Today's Cases</h3>
              <span className="text-xs font-medium text-slate-400">{casesToShow.length}</span>
            </div>
            <button className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Age</th>
                  <th className="px-4 py-3 font-semibold">Chief Complaint</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-6 py-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {casesToShow.map((row, i) => {
                  const badge = STATUS_STYLES[row.status];
                  return (
                    <tr
                      key={i}
                      onClick={() => {
                        if ('patientId' in row && (row as any).patientId) {
                          navigate(`/doctor/patient/${(row as any).patientId}`);
                        }
                      }}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {row.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-semibold text-slate-700">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{row.age}</td>
                      <td className="px-4 py-3.5 text-slate-600">{row.complaint}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            row.priority === 'High' ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {row.priority === 'High' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500 font-medium">{row.time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Priority Cases
            </h3>
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4" />
                  Priority Case
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {priorityPatient
                    ? priorityPatient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                    : 'RK'}
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    {priorityPatient
                      ? `${priorityPatient.name}, ${priorityPatient.age}${priorityPatient.gender === 'F' ? '/F' : priorityPatient.gender === 'M' ? '/M' : ''}`
                      : 'Rahul Kumar, 42/M'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {priorityPatient
                      ? `Token ${priorityPatient.token} — awaiting review`
                      : '"Persistent headache with dizziness"'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-white/70 border border-rose-200 rounded-xl p-3.5 mb-4">
                <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-sm text-rose-700">
                  Potential red-flag symptoms detected — doctor review required.
                </p>
              </div>
              <button
                onClick={() => navigate(priorityPatient ? `/doctor/patient/${priorityPatient.patientId}` : '/doctor/patient/mc12345')}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold py-3 rounded-xl shadow-sm transition-colors"
              >
                Review Case
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-500" />
              AI Intake & Voice Workflow
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <ol className="space-y-0">
                {[
                  { step: 'Patient speaks', sub: 'AI collects medical history' },
                  { step: 'AI structures information', sub: 'Symptoms & history digitized' },
                  { step: 'Documents digitized', sub: 'OCR & extraction' },
                  { step: 'Concise clinical summary', sub: 'Delivered for doctor review' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      {i < 3 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-semibold text-slate-700">{item.step}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => navigate('/voice')}
                className="w-full mt-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-3 rounded-xl shadow-sm transition-colors"
              >
                <Mic className="w-4 h-4" />
                Open Voice Input
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3.5 px-5 sm:px-6 py-3.5">
                <div className={`p-2 rounded-lg ${a.color}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-slate-700 flex-1">{a.text}</p>
                <span className="text-xs text-slate-400 font-medium">{a.time}</span>
              </div>
            ))}
          </div>
        </section>

        {loading && (
          <p className="text-sm text-slate-400">
            {queue.length === 0 ? 'Loading live queue...' : ''}
          </p>
        )}
      </div>
    </DoctorLayout>
  );
}
