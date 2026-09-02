import { Check } from 'lucide-react';

interface ChoiceQuestionProps {
  options: string[];
  multiple?: boolean;
  selected: string[];
  onSelect: (values: string[]) => void;
}

export default function ChoiceQuestion({ options, multiple = false, selected, onSelect }: ChoiceQuestionProps) {
  const handleClick = (option: string) => {
    if (multiple) {
      if (selected.includes(option)) {
        onSelect(selected.filter((s) => s !== option));
      } else {
        onSelect([...selected, option]);
      }
    } else {
      onSelect([option]);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            onClick={() => handleClick(option)}
            className={`w-full flex items-center gap-3 text-left border-2 rounded-2xl px-6 py-4 text-lg font-medium transition-all min-h-[64px] ${
              isSelected
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-navy-200 bg-white text-navy-700 hover:border-primary-300 hover:bg-primary-50/50'
            }`}
          >
            {multiple && (
              <div
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-primary-500 bg-primary-500' : 'border-navy-300'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>
            )}
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}
