import { Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-navy-200 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className="bg-primary-500 p-2 rounded-xl">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-navy-800">MediKiosk</h1>
      </div>
    </header>
  );
}
