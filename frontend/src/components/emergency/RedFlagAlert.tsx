import { AlertTriangle, Phone } from 'lucide-react';

interface RedFlagAlertProps {
  onCallStaff?: () => void;
}

export default function RedFlagAlert({ onCallStaff }: RedFlagAlertProps) {
  return (
    <div className="fixed inset-0 bg-danger-50 z-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-danger-100 p-6 rounded-full mb-6">
        <AlertTriangle className="w-16 h-16 text-danger-500" />
      </div>
      <h1 className="text-3xl font-bold text-danger-700 mb-4">
        Please wait
      </h1>
      <p className="text-xl text-danger-600 mb-2 max-w-md">
        Your symptoms may need urgent medical attention.
      </p>
      <p className="text-lg text-danger-500 mb-8 max-w-md">
        A hospital staff member has been alerted.
      </p>
      <p className="text-lg text-danger-600 mb-8 font-medium">
        Please remain here.
      </p>
      <button
        onClick={onCallStaff}
        className="bg-danger-500 hover:bg-danger-600 text-white text-xl font-bold py-5 px-10 rounded-2xl shadow-lg flex items-center gap-3 min-h-[72px]"
      >
        <Phone className="w-6 h-6" />
        Call Staff
      </button>
    </div>
  );
}
