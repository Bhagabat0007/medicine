import SummarySection from './SummarySection';
import type { ClinicalSummary as ClinicalSummaryType } from '../../types';

interface ClinicalSummaryProps {
  summary: ClinicalSummaryType;
  onSummaryChange?: (summary: ClinicalSummaryType) => void;
}

export default function ClinicalSummary({ summary, onSummaryChange }: ClinicalSummaryProps) {
  const handleEditSection = (field: keyof ClinicalSummaryType, value: any) => {
    if (!onSummaryChange) return;
    onSummaryChange({ ...summary, [field]: value });
  };

  return (
    <div className="space-y-4 w-full">
      <SummarySection
        title="Chief Complaint"
        content={summary.chief_complaint.text}
        onEdit={(val) => handleEditSection('chief_complaint', { text: val })}
      />

      <SummarySection
        title="History of Present Illness"
        content={[
          summary.hpi.onset ? `Onset: ${summary.hpi.onset}` : '',
          summary.hpi.severity ? `Severity: ${summary.hpi.severity}/10` : '',
          summary.hpi.character ? `Character: ${summary.hpi.character}` : '',
          summary.hpi.location ? `Location: ${summary.hpi.location}` : '',
          summary.hpi.duration ? `Duration: ${summary.hpi.duration}` : '',
          summary.hpi.associated_symptoms?.length
            ? `Associated: ${summary.hpi.associated_symptoms.join(', ')}`
            : '',
        ].filter(Boolean)}
      />

      <SummarySection
        title="Past Medical History"
        content={
          summary.past_medical_history.length > 0
            ? summary.past_medical_history
            : ['No significant past medical history reported']
        }
        onEdit={(val) => handleEditSection('past_medical_history', val.split('\n').filter(Boolean))}
      />

      <SummarySection
        title="Medications"
        content={
          summary.medications.length > 0
            ? summary.medications.map((m) => `${m.name}${m.dosage ? ` - ${m.dosage}` : ''}`)
            : ['No current medications reported']
        }
        onEdit={(val) =>
          handleEditSection(
            'medications',
            val.split('\n').filter(Boolean).map((name) => ({ name }))
          )
        }
      />

      <SummarySection
        title="Allergies"
        content={
          summary.allergies.length > 0
            ? summary.allergies
            : ['No known allergies reported']
        }
        onEdit={(val) => handleEditSection('allergies', val.split('\n').filter(Boolean))}
      />

      <SummarySection
        title="Family History"
        content={
          summary.family_history.length > 0
            ? summary.family_history
            : ['No family history reported']
        }
        onEdit={(val) => handleEditSection('family_history', val.split('\n').filter(Boolean))}
      />

      <SummarySection
        title="Personal History"
        content={
          Object.keys(summary.personal_history).length > 0
            ? Object.entries(summary.personal_history).map(([k, v]) => `${k}: ${v}`)
            : ['No personal history reported']
        }
      />

      <SummarySection
        title="Review of Systems"
        content={
          Object.keys(summary.review_of_systems).length > 0
            ? Object.entries(summary.review_of_systems).map(([k, v]) => `${k}: ${v}`)
            : ['No additional symptoms reported']
        }
      />
    </div>
  );
}
