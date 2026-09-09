import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api';

const SPECIALIZATION_ICONS = {
  'Cardiologist': '❤️',
  'Neurologist': '🧠',
  'Orthopedic': '🦴',
  'Pulmonologist': '🫁',
  'Gastroenterologist': '🩺',
  'Dermatologist': '🧴',
  'ENT Specialist': '👂',
  'General Physician': '👨‍⚕️',
  'Ophthalmologist': '👁️',
  'Psychiatrist': '🧘',
  'Urologist': '💧',
  'Gynecologist': '🌸',
  'Default': '👨‍⚕️'
};

function DoctorSelection({ recommendedSpecialist, onSelect, onBack }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/doctors`).then(res => {
      // Show all doctors, highlight the recommended specialist
      setDoctors(res.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSelect = (doctor) => {
    setSelectedId(doctor.id);
  };

  const handleContinue = () => {
    const doctor = doctors.find(d => d.id === selectedId);
    if (doctor) onSelect(doctor);
  };

  if (loading) {
    return (
      <div className="form-card">
        <h2>Loading doctors...</h2>
      </div>
    );
  }

  return (
    <div className="form-card">
      <h2>Choose Your Doctor</h2>
      <p className="help-text">
        Based on your symptoms, we recommend a <strong>{recommendedSpecialist}</strong>.
        Select a doctor to proceed.
      </p>

      <div className="doctor-grid">
        {doctors.map((doc) => {
          const isRecommended = doc.specialization === recommendedSpecialist;
          const icon = SPECIALIZATION_ICONS[doc.specialization] || SPECIALIZATION_ICONS['Default'];
          return (
            <div
              key={doc.id}
              className={`doctor-card ${selectedId === doc.id ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
              onClick={() => handleSelect(doc)}
            >
              {isRecommended && <div className="recommended-badge">Recommended</div>}
              <div className="doctor-avatar">{icon}</div>
              <div className="doctor-name">{doc.name}</div>
              <div className="doctor-specialization">{doc.specialization}</div>
              <div className="doctor-status">
                <span className="status-dot available"></span>
                Available
              </div>
            </div>
          );
        })}
      </div>

      <div className="button-group">
        <button type="button" className="btn btn-secondary" onClick={onBack}>Back</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selectedId}
          onClick={handleContinue}
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
}

export default DoctorSelection;
