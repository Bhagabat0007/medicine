import { useState } from 'react';
import axios from 'axios';
import MedicalHistory from './MedicalHistory';
import DoctorSelection from './DoctorSelection';
import MedicalSheet from './MedicalSheet';

const API_URL = '/api';

const STEP_LABELS = [
  'Personal Info',
  'Symptoms',
  'Follow-up',
  'History',
  'Analysis',
  'Doctor',
  'Token'
];

function PatientPortal() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    symptoms: ''
  });
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [medicalHistoryQuestions, setMedicalHistoryQuestions] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [medicalHistory, setMedicalHistory] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFollowUpSelect = (questionId, value) => {
    setFollowUpAnswers({ ...followUpAnswers, [questionId]: value });
  };

  // Step 1 -> Step 2
  const goStep2 = () => setStep(2);

  // Step 2 -> Step 3 (fetch follow-up questions)
  const goStep3 = async () => {
    if (!formData.symptoms.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/symptoms/questions`, { symptoms: formData.symptoms });
      setFollowUpQuestions(res.data.followUpQuestions || []);
      setMedicalHistoryQuestions(res.data.medicalHistoryQuestions || []);
      setStep(3);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> Step 4
  const goStep4 = () => setStep(4);

  // Step 4 -> Step 5 (analyze)
  const goStep5 = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/symptoms/analyze`, {
        symptoms: formData.symptoms,
        followUpAnswers,
        medicalHistory,
        age: parseInt(formData.patient_age) || null,
        gender: formData.patient_gender || null
      });
      setAnalysis(res.data);
      setStep(5);
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 5 -> Step 6
  const goStep6 = () => setStep(6);

  // Step 6 -> Step 7 (generate token)
  const goStep7 = async (doctor) => {
    setSelectedDoctor(doctor);
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/tokens/generate`, {
        patient_name: formData.patient_name,
        patient_age: parseInt(formData.patient_age) || null,
        patient_gender: formData.patient_gender || null,
        symptoms: formData.symptoms,
        followUpAnswers,
        medicalHistory,
        predictedConditions: analysis?.predictedConditions || [],
        urgency: analysis?.urgency || 'normal',
        recommendedSpecialist: analysis?.recommendedSpecialist || 'General Physician',
        analysisSummary: analysis?.analysisSummary || ''
      });
      setToken(res.data.token);
      setStep(7);
    } catch (err) {
      setError('Failed to generate token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ patient_name: '', patient_age: '', patient_gender: '', symptoms: '' });
    setFollowUpQuestions([]);
    setMedicalHistoryQuestions([]);
    setFollowUpAnswers({});
    setMedicalHistory({});
    setAnalysis(null);
    setSelectedDoctor(null);
    setToken(null);
    setStep(1);
  };

  const answeredCount = Object.keys(followUpAnswers).length;

  return (
    <div className="patient-portal">
      <div className="portal-header">
        <h1>Patient Registration</h1>
        <p>Get your consultation token in seconds</p>
      </div>

      {/* Step Indicator */}
      {step < 7 && (
        <div className="step-indicator">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className={`step-dot ${i + 1 < step ? 'completed' : i + 1 === step ? 'active' : ''}`}>
              <div className="dot">
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="form-card">
          <h2>Personal Information</h2>
          <form onSubmit={(e) => { e.preventDefault(); goStep2(); }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="patient_age"
                  value={formData.patient_age}
                  onChange={handleChange}
                  placeholder="Age"
                  min="0"
                  max="150"
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  name="patient_gender"
                  value={formData.patient_gender}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block">Continue</button>
          </form>
        </div>
      )}

      {/* Step 2: Describe Symptoms */}
      {step === 2 && (
        <div className="form-card">
          <h2>Describe Your Symptoms</h2>
          <p className="help-text">
            Tell us what's bothering you. Be as detailed as possible for accurate specialist recommendation.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); goStep3(); }}>
            <div className="form-group">
              <label>Your Symptoms *</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                placeholder="Example: I have been experiencing chest pain and shortness of breath for the past 2 days. The pain is sharp and occurs when I climb stairs..."
                rows="6"
                required
              />
            </div>
            <div className="button-group">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Analyzing...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Follow-up Questions */}
      {step === 3 && (
        <div className="form-card">
          <h2>Follow-up Questions</h2>
          <p className="help-text">
            Please answer these questions to help us better understand your condition.
            ({answeredCount}/{followUpQuestions.length} answered)
          </p>

          {followUpQuestions.map((q) => (
            <div className="form-group" key={q.id}>
              <label>{q.question}</label>
              <div className="mcq-options">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`mcq-option ${followUpAnswers[q.id] === opt ? 'selected' : ''}`}
                    onClick={() => handleFollowUpSelect(q.id, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="button-group">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={answeredCount < followUpQuestions.length}
              onClick={goStep4}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Medical History */}
      {step === 4 && (
        <MedicalHistory
          questions={medicalHistoryQuestions}
          onNext={(data) => { setMedicalHistory(data); goStep5(); }}
          onBack={() => setStep(3)}
        />
      )}

      {/* Step 5: AI Analysis Results */}
      {step === 5 && analysis && (
        <div className="form-card analysis-card">
          <h2>AI Health Assessment</h2>
          <p className="help-text">
            This is an AI-generated prediction for doctor review. Not a final diagnosis.
          </p>

          <div className={`urgency-banner urgency-${analysis.urgency}`}>
            {analysis.urgency === 'urgent' && '⚠ Urgent - Immediate attention recommended'}
            {analysis.urgency === 'moderate' && '⚡ Moderate - Priority consultation'}
            {analysis.urgency === 'normal' && '✓ Normal - Routine consultation'}
          </div>

          <div className="predicted-conditions">
            <h3>Possible Conditions</h3>
            {analysis.predictedConditions.map((cond, i) => (
              <div className="predicted-condition" key={i}>
                <div className="condition-top">
                  <span className="condition-name">{cond.name}</span>
                  <span className="condition-pct">{cond.confidence}%</span>
                </div>
                <div className="confidence-bar">
                  <div
                    className={`confidence-fill ${cond.confidence > 70 ? 'high' : cond.confidence > 40 ? 'medium' : 'low'}`}
                    style={{ width: cond.confidence + '%' }}
                  ></div>
                </div>
                <p className="condition-desc">{cond.description}</p>
              </div>
            ))}
          </div>

          <div className="specialist-recommendation">
            <span className="rec-label">Recommended Specialist</span>
            <span className="rec-value">{analysis.recommendedSpecialist}</span>
          </div>

          <div className="button-group">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(4)}>Back</button>
            <button type="button" className="btn btn-primary" disabled={loading} onClick={goStep6}>
              Choose Doctor
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Doctor Selection */}
      {step === 6 && (
        <DoctorSelection
          recommendedSpecialist={analysis?.recommendedSpecialist}
          onSelect={goStep7}
          onBack={() => setStep(5)}
        />
      )}

      {/* Step 7: Medical Sheet + Token */}
      {step === 7 && token && (
        <MedicalSheet token={token} onReset={resetForm} />
      )}

      {loading && step !== 2 && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default PatientPortal;
