function MedicalSheet({ token, onReset }) {
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
      <h1>Token Generated Successfully!</h1>

      <div className="medical-sheet">
        <div className="sheet-header">
          <div className="sheet-title">
            <span className="sheet-icon">🏥</span>
            <div>
              <h2>MediKiosk Clinical Intake Sheet</h2>
              <p>AI-Assisted Pre-Consultation Summary</p>
            </div>
          </div>
          <div className="sheet-token">
            <span className="label">Token</span>
            <span className="number">#{token.token_number}</span>
          </div>
        </div>

        <div className={`sheet-urgency urgency-${urgencyClass}`}>
          <span className="urgency-dot"></span>
          {token.priority === 'urgent' ? 'URGENT - Immediate Attention Required' :
           token.priority === 'moderate' ? 'MODERATE - Priority Consultation' :
           'NORMAL - Routine Consultation'}
        </div>

        <div className="sheet-section">
          <h3>Patient Information</h3>
          <div className="detail-row">
            <span className="label">Name</span>
            <span className="value">{token.patient_name}</span>
          </div>
          {token.patient_age && (
            <div className="detail-row">
              <span className="label">Age</span>
              <span className="value">{token.patient_age} years</span>
            </div>
          )}
          {token.patient_gender && (
            <div className="detail-row">
              <span className="label">Gender</span>
              <span className="value">{token.patient_gender}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="label">Date & Time</span>
            <span className="value">{new Date().toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}</span>
          </div>
        </div>

        <div className="sheet-section">
          <h3>Chief Complaint</h3>
          <p className="symptoms-text">{token.symptoms}</p>
        </div>

        {Object.keys(followUpAnswers).length > 0 && (
          <div className="sheet-section">
            <h3>Follow-Up Details</h3>
            {formatFollowUp(followUpAnswers)}
          </div>
        )}

        {(medicalHistory.conditions?.length > 0 || medicalHistory.allergies || medicalHistory.medications) && (
          <div className="sheet-section">
            <h3>Medical History</h3>
            {medicalHistory.conditions?.length > 0 && (
              <div className="detail-row">
                <span className="label">Conditions</span>
                <span className="value">{medicalHistory.conditions.join(', ')}</span>
              </div>
            )}
            {medicalHistory.allergies && (
              <div className="detail-row">
                <span className="label">Allergies</span>
                <span className="value">{medicalHistory.allergies}</span>
              </div>
            )}
            {medicalHistory.medications && (
              <div className="detail-row">
                <span className="label">Medications</span>
                <span className="value">{medicalHistory.medications}</span>
              </div>
            )}
            {medicalHistory.surgeries && (
              <div className="detail-row">
                <span className="label">Previous Surgeries</span>
                <span className="value">{medicalHistory.surgeries}</span>
              </div>
            )}
            {medicalHistory.family_history && (
              <div className="detail-row">
                <span className="label">Family History</span>
                <span className="value">{medicalHistory.family_history}</span>
              </div>
            )}
          </div>
        )}

        {predictedConditions.length > 0 && (
          <div className="sheet-section">
            <h3>AI Analysis <span className="draft-badge">Draft - For Doctor Review Only</span></h3>
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
          <h3>Assigned Doctor</h3>
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
            <span className="wait-label">Estimated Wait</span>
            <span className="wait-value">{token.estimated_wait || 5} min</span>
          </div>
          <div className="sheet-notice">
            Please proceed to the waiting area. Bring this sheet or your token number to the doctor.
          </div>
        </div>
      </div>

      <div className="button-group" style={{ marginTop: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          Print Sheet
        </button>
        <button className="btn btn-primary" onClick={onReset}>
          New Patient
        </button>
      </div>
    </div>
  );
}

export default MedicalSheet;
