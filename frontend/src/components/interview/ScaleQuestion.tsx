interface ScaleQuestionProps {
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  value: number;
  onChange: (value: number) => void;
}

export default function ScaleQuestion({
  min = 0,
  max = 10,
  minLabel = 'No pain',
  maxLabel = 'Worst pain',
  value,
  onChange,
}: ScaleQuestionProps) {
  const getColor = (val: number) => {
    const ratio = (val - min) / (max - min);
    if (ratio <= 0.3) return 'bg-success-500';
    if (ratio <= 0.6) return 'bg-warning-400';
    return 'bg-danger-500';
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-5xl font-bold text-navy-800">{value}</div>

      <div className="w-full relative px-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}

          className="w-full h-3 rounded-full appearance-none cursor-pointer bg-navy-200 accent-primary-500"
        />
        <div className="flex justify-between mt-2">
          <span className="text-sm text-navy-500">{minLabel}</span>
          <span className="text-sm text-navy-500">{maxLabel}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
              value === num
                ? `${getColor(num)} text-white scale-110`
                : 'bg-navy-100 text-navy-600 hover:bg-navy-200'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
