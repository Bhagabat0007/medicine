function TokenResult({ token, onReset }) {
  const getPriorityColor = (priority) => {
    return priority === 'urgent' ? 'urgent' : 'normal';
  };

  const getStatusColor = (status) => {
    const colors = {
      waiting: 'waiting',
      in_consultation: 'consultation',
      completed: 'completed'
    };
    return colors[status] || 'waiting';
  };

  return (
    <div className="token-result">
      <div className="success-icon">✓</div>
      <h1>Token Generated Successfully!</h1>

      <div className="token-card">
        <div className="token-header">
          <span className={`priority-badge ${getPriorityColor(token.priority)}`}>
            {token.priority === 'urgent' ? '⚠️ URGENT' : 'NORMAL'}
          </span>
          <span className={`status-badge ${getStatusColor(token.status)}`}>
            {token.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="token-number">
          <span className="label">Token Number</span>
          <span className="number">#{token.token_number}</span>
        </div>

        <div className="token-details">
          <div className="detail-row">
            <span className="label">Patient</span>
            <span className="value">{token.patient_name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Recommended Specialist</span>
            <span className="value specialist">{token.recommended_specialist}</span>
          </div>
          <div className="detail-row">
            <span className="label">Doctor</span>
            <span className="value">{token.doctor_name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Confidence</span>
            <span className="value">{token.confidence}%</span>
          </div>
          <div className="detail-row">
            <span className="label">Estimated Wait</span>
            <span className="value">~{token.estimated_wait} minutes</span>
          </div>
        </div>

        <div className="symptoms-summary">
          <span className="label">Your Symptoms</span>
          <p className="symptoms">{token.symptoms}</p>
        </div>
      </div>

      <div className="info-box">
        <strong>What's Next?</strong>
        <ul>
          <li>Please wait in the waiting area</li>
          <li>Listen for your token number to be called</li>
          <li>The doctor has already received your case summary</li>
          <li>Bring any previous medical records if available</li>
        </ul>
      </div>

      <button className="btn btn-primary" onClick={onReset}>
        Register Another Patient
      </button>
    </div>
  );
}

export default TokenResult;
