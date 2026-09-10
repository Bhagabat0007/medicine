import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import OCRUpload from './OCRUpload';

function MedicalHistory({ questions, onNext, onBack }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    conditions: [],
    allergies: '',
    medications: '',
    surgeries: '',
    family_history: ''
  });

  const toggleCondition = (condition) => {
    const noneText = t('patientPortal.medicalHistory.noneOfAbove');
    if (condition === noneText) {
      setFormData({ ...formData, conditions: [noneText] });
      return;
    }
    const updated = formData.conditions.filter(c => c !== noneText);
    if (updated.includes(condition)) {
      setFormData({ ...formData, conditions: updated.filter(c => c !== condition) });
    } else {
      setFormData({ ...formData, conditions: [...updated, condition] });
    }
  };

  const handleTextChange = (id, value) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleOCRText = (text) => {
    if (!text) return;
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('medication') || lowerText.includes('drug') || lowerText.includes('prescription') || lowerText.includes('tablet') || lowerText.includes('mg') || lowerText.includes('ml')) {
      setFormData(prev => ({ ...prev, medications: prev.medications ? prev.medications + '\n' + text : text }));
    } else if (lowerText.includes('allerg') || lowerText.includes('hypersens')) {
      setFormData(prev => ({ ...prev, allergies: prev.allergies ? prev.allergies + '\n' + text : text }));
    } else if (lowerText.includes('surger') || lowerText.includes('operation') || lowerText.includes('appendect') || lowerText.includes('bypass')) {
      setFormData(prev => ({ ...prev, surgeries: prev.surgeries ? prev.surgeries + '\n' + text : text }));
    } else if (lowerText.includes('famil') || lowerText.includes('father') || lowerText.includes('mother') || lowerText.includes('parent') || lowerText.includes('sister') || lowerText.includes('brother')) {
      setFormData(prev => ({ ...prev, family_history: prev.family_history ? prev.family_history + '\n' + text : text }));
    } else {
      setFormData(prev => ({ ...prev, medications: prev.medications ? prev.medications + '\n' + text : text }));
    }
  };

  return (
    <div className="form-card">
      <h2>{t('patientPortal.medicalHistory.title')}</h2>
      <p className="help-text">
        {t('patientPortal.medicalHistory.helpText')}
      </p>

      <OCRUpload onTextExtracted={handleOCRText} existingText={formData.medications} />

      {questions.map((q) => (
        <div className="form-group" key={q.id}>
          <label>{q.question}</label>
          {q.type === 'multi-select' && (
            <div className="condition-grid">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`condition-chip ${formData[q.id]?.includes(opt) ? 'selected' : ''}`}
                  onClick={() => toggleCondition(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {q.type === 'text' && (
            <input
              type="text"
              value={formData[q.id] || ''}
              onChange={(e) => handleTextChange(q.id, e.target.value)}
              placeholder={q.placeholder}
            />
          )}
        </div>
      ))}

      <div className="button-group">
        <button type="button" className="btn btn-secondary" onClick={onBack}>{t('patientPortal.medicalHistory.back')}</button>
        <button type="button" className="btn btn-primary" onClick={() => onNext(formData)}>{t('patientPortal.medicalHistory.continue')}</button>
      </div>
    </div>
  );
}

export default MedicalHistory;
