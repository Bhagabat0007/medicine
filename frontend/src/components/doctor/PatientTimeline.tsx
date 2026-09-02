interface TimelineEvent {
  year: string;
  entries: {
    label: string;
    type: 'diag' | 'test' | 'rx' | 'img' | 'symptom' | 'ai' | 'consult';
  }[];
}

const TIMELINE: TimelineEvent[] = [
  {
    year: '2022',
    entries: [{ label: 'Hypertension diagnosed', type: 'diag' }],
  },
  {
    year: '2023',
    entries: [
      { label: 'Blood test', type: 'test' },
      { label: 'Prescription', type: 'rx' },
    ],
  },
  {
    year: '2024',
    entries: [
      { label: 'X-Ray Chest', type: 'img' },
      { label: 'Physiotherapy', type: 'consult' },
    ],
  },
  {
    year: '2025',
    entries: [
      { label: 'Current symptoms', type: 'symptom' },
      { label: 'AI Case Summary', type: 'ai' },
      { label: 'Doctor Consultation', type: 'consult' },
    ],
  },
];

const TYPE_ICON: Record<string, string> = {
  diag: 'D',
  test: 'T',
  rx: 'Rx',
  img: 'I',
  symptom: 'S',
  ai: 'AI',
  consult: 'C',
};

const TYPE_STYLE: Record<string, string> = {
  diag: 'bg-rose-100 text-rose-600 border-rose-200',
  test: 'bg-blue-100 text-blue-600 border-blue-200',
  rx: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  img: 'bg-violet-100 text-violet-600 border-violet-200',
  symptom: 'bg-amber-100 text-amber-600 border-amber-200',
  ai: 'bg-teal-100 text-teal-600 border-teal-200',
  consult: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function PatientTimeline() {
  return (
    <div className="space-y-1">
      {TIMELINE.map((period, pi) => (
        <div key={period.year} className="relative">
          <div className="flex gap-5">
            <div className="flex flex-col items-center shrink-0">
              <span
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm ${
                  pi === TIMELINE.length - 1
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-emerald-400 text-emerald-600'
                }`}
              >
                {period.year.slice(2)}
              </span>
              {pi < TIMELINE.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1.5" />}
            </div>

            <div className="pb-7 flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 mb-3">{period.year}</p>
              <div className="space-y-2">
                {period.entries.map((entry, ei) => (
                  <div
                    key={ei}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5"
                  >
                    <span
                      className={`w-9 h-6 rounded-md border flex items-center justify-center text-[10px] font-bold shrink-0 ${TYPE_STYLE[entry.type]}`}
                    >
                      {TYPE_ICON[entry.type]}
                    </span>
                    <span className="text-sm text-slate-700 font-medium">{entry.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
