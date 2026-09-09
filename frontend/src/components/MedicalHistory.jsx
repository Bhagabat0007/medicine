import { useState } from 'react';

function MedicalHistory({ questions, onNext, onBack }) {
  const [formData, setFormData] = useState({
    conditions: [],
    allergies: '',
    medications: '',
    surgeries: '',
    family_history: ''
  });

  const toggleCondition = (condition) => {
    if (condition === 'None of the above') {
      setFormData({ ...formData, conditions: ['None of the above'] });
      return;
    }
    const updated = formData.conditions.filter(c => c !== 'None of the above');
    if (updated.includes(condition)) {
      setFormData({ ...formData, conditions: updated.filter(c => c !== condition) });
    } else {
      setFormData({ ...formData, conditions: [...updated, condition] });
    }
  };

  const handleTextChange = (id, value) => {
    setFormData({ ...formData, [id]: value });
  };

  return (
    <div className="form-card">
      <h2>Medical History</h2>
      <p className="help-text">
        This information helps our AI provide more accurate predictions. All fields are optional.
      </p>

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
        <button type="button" className="btn btn-secondary" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => onNext(formData)}>Continue</button>
      </div>
    </div>
  );
}

export default MedicalHistory;
