import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import MedicalHistory from './MedicalHistory';
import DoctorSelection from './DoctorSelection';
import MedicalSheet from './MedicalSheet';
import VoiceRecorder from './VoiceRecorder';
import WebSpeechRecorder from './WebSpeechRecorder';
import { API_URL } from '../config/api';

function PatientPortal() {
  const { t } = useTranslation();
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
  const [voiceMode, setVoiceMode] = useState('server'); // 'server' | 'browser'

  const STEP_LABELS = [
    t('patientPortal.steps.personalInfo'),
    t('patientPortal.steps.symptoms'),
    t('patientPortal.steps.followUp'),
    t('patientPortal.steps.history'),
    t('patientPortal.steps.analysis'),
    t('patientPortal.steps.doctor'),
    t('patientPortal.steps.token')
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVoiceTranscribe = (text) => {
    setFormData({ ...formData, symptoms: text });
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
      setError(t('errors.questionsLoadFailed'));
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
      setError(t('errors.analysisFailed'));
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
      setError(t('errors.tokenGenerationFailed'));
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
        <h1>{t('patientPortal.title')}</h1>
        <p>{t('patientPortal.subtitle')}</p>
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
          <h2>{t('patientPortal.personalInfo.title')}</h2>
          <form onSubmit={(e) => { e.preventDefault(); goStep2(); }}>
            <div className="form-group">
              <label>{t('patientPortal.personalInfo.fullName')} *</label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                placeholder={t('patientPortal.personalInfo.fullNamePlaceholder')}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('patientPortal.personalInfo.age')}</label>
                <input
                  type="number"
                  name="patient_age"
                  value={formData.patient_age}
                  onChange={handleChange}
                  placeholder={t('patientPortal.personalInfo.agePlaceholder')}
                  min="0"
                  max="150"
                />
              </div>
              <div className="form-group">
                <label>{t('patientPortal.personalInfo.gender')}</label>
                <select
                  name="patient_gender"
                  value={formData.patient_gender}
                  onChange={handleChange}
                >
                  <option value="">{t('patientPortal.personalInfo.genderPlaceholder')}</option>
                  <option value="male">{t('patientPortal.personalInfo.male')}</option>
                  <option value="female">{t('patientPortal.personalInfo.female')}</option>
                  <option value="other">{t('patientPortal.personalInfo.other')}</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block">{t('patientPortal.personalInfo.continue')}</button>
          </form>
        </div>
      )}

      {/* Step 2: Describe Symptoms */}
      {step === 2 && (
        <div className="form-card">
          <h2>{t('patientPortal.symptoms.title')}</h2>
          <p className="help-text">
            {t('patientPortal.symptoms.helpText')}
          </p>
          <form onSubmit={(e) => { e.preventDefault(); goStep3(); }}>
            <div className="voice-mode-selector">
              <label>{t('patientPortal.symptoms.voiceInputMethod')}</label>
              <div className="voice-mode-tabs">
                <button
                  type="button"
                  className={`voice-mode-tab ${voiceMode === 'server' ? 'active' : ''}`}
                  onClick={() => setVoiceMode('server')}
                >
                  {t('patientPortal.symptoms.serverMode')}
                </button>
                <button
                  type="button"
                  className={`voice-mode-tab ${voiceMode === 'browser' ? 'active' : ''}`}
                  onClick={() => setVoiceMode('browser')}
                >
                  {t('patientPortal.symptoms.browserMode')}
                </button>
              </div>
            </div>

            {voiceMode === 'server' && (
              <VoiceRecorder onTranscribe={handleVoiceTranscribe} />
            )}

            {voiceMode === 'browser' && (
              <WebSpeechRecorder onTranscribe={handleVoiceTranscribe} />
            )}

            <div className="form-group">
              <label>{t('patientPortal.symptoms.placeholder').split('Example:')[0] || t('patientPortal.symptoms.placeholder')} *</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                placeholder={t('patientPortal.symptoms.placeholder')}
                rows="6"
                required
              />
            </div>
            <div className="button-group">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>{t('patientPortal.symptoms.back')}</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('patientPortal.symptoms.analyzing') : t('patientPortal.symptoms.continue')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Follow-up Questions */}
      {step === 3 && (
        <div className="form-card">
          <h2>{t('patientPortal.followUp.title')}</h2>
          <p className="help-text">
            {t('patientPortal.followUp.helpText')}
            ({answeredCount}/{followUpQuestions.length} {t('patientPortal.followUp.answered')})
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
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>{t('patientPortal.followUp.back')}</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={answeredCount < followUpQuestions.length}
              onClick={goStep4}
            >
              {t('patientPortal.followUp.continue')}
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
          <h2>{t('patientPortal.analysis.title')}</h2>
          <p className="help-text">
            {t('patientPortal.analysis.disclaimer')}
          </p>

          <div className={`urgency-banner urgency-${analysis.urgency}`}>
            {analysis.urgency === 'urgent' && t('patientPortal.analysis.urgent')}
            {analysis.urgency === 'moderate' && t('patientPortal.analysis.moderate')}
            {analysis.urgency === 'normal' && t('patientPortal.analysis.normal')}
          </div>

          <div className="predicted-conditions">
            <h3>{t('patientPortal.analysis.possibleConditions')}</h3>
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
            <span className="rec-label">{t('patientPortal.analysis.recommendedSpecialist')}</span>
            <span className="rec-value">{analysis.recommendedSpecialist}</span>
          </div>

          <div className="button-group">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(4)}>{t('patientPortal.analysis.back')}</button>
            <button type="button" className="btn btn-primary" disabled={loading} onClick={goStep6}>
              {t('patientPortal.analysis.chooseDoctor')}
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
