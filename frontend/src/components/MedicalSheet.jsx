import { useTranslation } from 'react-i18next';

function MedicalSheet({ token, onReset }) {
  const { t } = useTranslation();
  if (!token) return null;

  const predictedConditions = token.predicted_conditions || [];
  const medicalHistory = token.medical_history || {};
  const followUpAnswers = token.follow_up_answers || {};

  const urgencyClass = token.priority === 'urgent' ? 'urgent' : token.priority === 'moderate' ? 'moderate' : 'normal';

  const formatFollowUp = (answers) => {
    if (!answers || typeof answers !== 'object') return null;
    return Object.entries(answers).map(([key, value]) => (
      <div className="detail-row" key={key}>
        <span className="label">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
        <span className="value">{value}</span>
      </div>
    ));
  };

  return (
    <div className="medical-sheet-container">
      <div className="success-icon">✓</div>
      <h1>{t('common.success')}</h1>

      <div className="medical-sheet">
        <div className="sheet-header">
          <div className="sheet-title">
            <span className="sheet-icon">🏥</span>
            <div>
              <h2>{t('patientPortal.token.title')}</h2>
              <p>{t('app.tagline')}</p>
            </div>
          </div>
          <div className="sheet-token">
            <span className="label">{t('patientPortal.token.tokenNumber')}</span>
            <span className="number">#{token.token_number}</span>
          </div>
        </div>

        <div className={`sheet-urgency urgency-${urgencyClass}`}>
          <span className="urgency-dot"></span>
          {token.priority === 'urgent' ? t('patientPortal.token.urgent') :
           token.priority === 'moderate' ? t('patientPortal.token.moderate') :
           t('patientPortal.token.normal')}
        </div>

        <div className="sheet-section">
          <h3>{t('patientPortal.token.patientDetails')}</h3>
          <div className="detail-row">
            <span className="label">{t('patientPortal.token.name')}</span>
            <span className="value">{token.patient_name}</span>
          </div>
          {token.patient_age && (
            <div className="detail-row">
              <span className="label">{t('patientPortal.token.age')}</span>
              <span className="value">{token.patient_age} {t('common.years') || 'years'}</span>
            </div>
          )}
          {token.patient_gender && (
            <div className="detail-row">
              <span className="label">{t('patientPortal.token.gender')}</span>
              <span className="value">{token.patient_gender}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="label">{t('common.dateTime') || 'Date & Time'}</span>
            <span className="value">{new Date().toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}</span>
          </div>
        </div>

        <div className="sheet-section">
          <h3>{t('patientPortal.token.symptoms')}</h3>
          <p className="symptoms-text">{token.symptoms}</p>
        </div>

        {Object.keys(followUpAnswers).length > 0 && (
          <div className="sheet-section">
            <h3>{t('patientPortal.token.followUpDetails') || 'Follow-Up Details'}</h3>
            {formatFollowUp(followUpAnswers)}
          </div>
        )}

        {(medicalHistory.conditions?.length > 0 || medicalHistory.allergies || medicalHistory.medications) && (
          <div className="sheet-section">
            <h3>{t('patientPortal.token.medicalHistory')}</h3>
            {medicalHistory.conditions?.length > 0 && (
              <div className="detail-row">
                <span className="label">{t('patientPortal.token.conditions')}</span>
                <span className="value">{medicalHistory.conditions.join(', ')}</span>
              </div>
            )}
            {medicalHistory.allergies && (
              <div className="detail-row">
                <span className="label">{t('patientPortal.token.allergies')}</span>
                <span className="value">{medicalHistory.allergies}</span>
              </div>
            )}
            {medicalHistory.medications && (
              <div className="detail-row">
                <span className="label">{t('patientPortal.token.medications')}</span>
                <span className="value">{medicalHistory.medications}</span>
              </div>
            )}
            {medicalHistory.surgeries && (
              <div className="detail-row">
                <span className="label">{t('patientPortal.token.surgeries')}</span>
                <span className="value">{medicalHistory.surgeries}</span>
              </div>
            )}
            {medicalHistory.family_history && (
              <div className="detail-row">
                <span className="label">{t('patientPortal.token.familyHistory')}</span>
                <span className="value">{medicalHistory.family_history}</span>
              </div>
            )}
          </div>
        )}

        {predictedConditions.length > 0 && (
          <div className="sheet-section">
            <h3>{t('patientPortal.token.aiAnalysis')} <span className="draft-badge">{t('patientPortal.token.draftBadge')}</span></h3>
            <div className="conditions-list">
              {predictedConditions.map((cond, i) => (
                <div className="condition-item" key={i}>
                  <div className="condition-header">
                    <span className="condition-name">{cond.name}</span>
                    <span className="condition-confidence">{cond.confidence}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: cond.confidence + '%' }}></div>
                  </div>
                  <p className="condition-desc">{cond.description}</p>
                </div>
              ))}
            </div>
            {token.analysisSummary && (
              <p className="analysis-summary">{token.analysisSummary}</p>
            )}
          </div>
        )}

        <div className="sheet-section">
          <h3>{t('patientPortal.token.assignedDoctor')}</h3>
          <div className="assigned-doctor">
            <span className="doctor-icon">👨‍⚕️</span>
            <div>
              <strong>{token.doctor_name || 'Dr. Rajesh Kumar'}</strong>
              <span>{token.recommended_specialist || token.doctor_specialization || 'General Physician'}</span>
            </div>
          </div>
        </div>

        <div className="sheet-footer">
          <div className="wait-time">
            <span className="wait-label">{t('patientPortal.token.estimatedWait')}</span>
            <span className="wait-value">{token.estimated_wait || 5} {t('patientPortal.token.minutes')}</span>
          </div>
          <div className="sheet-notice">
            {t('patientPortal.token.notice')}
          </div>
        </div>
      </div>

      <div className="button-group" style={{ marginTop: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          {t('common.print')}
        </button>
        <button className="btn btn-primary" onClick={onReset}>
          {t('patientPortal.token.newRegistration')}
        </button>
      </div>
    </div>
  );
}

export default MedicalSheet;
