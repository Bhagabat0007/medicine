import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface SummarySectionProps {
  title: string;
  content: string | string[];
  onEdit?: (newContent: string) => void;
}

export default function SummarySection({ title, content, onEdit }: SummarySectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    Array.isArray(content) ? content.join('\n') : content
  );

  const handleSave = () => {
    onEdit?.(editValue);
    setIsEditing(false);
  };

  const displayContent = Array.isArray(content) ? content : [content];

  return (
    <div className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-navy-700">{title}</h3>
        {onEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-base py-1 px-3"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full border-2 border-primary-300 rounded-xl px-4 py-3 text-lg focus:border-primary-500 focus:outline-none resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-base font-medium py-2 px-4 rounded-xl"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditValue(Array.isArray(content) ? content.join('\n') : content);
              }}
              className="flex items-center gap-1 bg-navy-200 hover:bg-navy-300 text-navy-700 text-base font-medium py-2 px-4 rounded-xl"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {displayContent.map((item, i) => (
            <p key={i} className="text-lg text-navy-600">
              {item || 'No information provided'}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
