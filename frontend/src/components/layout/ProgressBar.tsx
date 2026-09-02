import { useStore } from '../../store/useStore';

const STEP_LABELS = ['Welcome', 'Language', 'Consent', 'Details', 'Interview', 'Review'];

export default function ProgressBar() {
  const { currentStep, totalSteps } = useStore((s) => s.session);
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-white border-b border-navy-200 px-6 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-navy-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-navy-500">
            {STEP_LABELS[Math.min(currentStep - 1, STEP_LABELS.length - 1)]}
          </span>
        </div>
        <div className="w-full h-2 bg-navy-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
