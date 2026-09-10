import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import LanguageSelector from './LanguageSelector';
import { API_URL } from '../config/api';

// Status filter tabs
const STATUS_FILTERS = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'waiting', label: 'Waiting', icon: '⏳' },
  { key: 'urgent', label: 'Urgent', icon: '🚨' },
  { key: 'in_consultation', label: 'In Consultation', icon: '🩺' },
  { key: 'completed', label: 'Completed', icon: '✅' },
];

function DoctorDashboard() {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedToken, setSelectedToken] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consultationData, setConsultationData] = useState({
    clinicalNotes: '',
    medications: [{ drugName: '', dosage: '', frequency: '', duration: '' }],
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Fetch tokens on mount and when needed
  const fetchTokens = async () => {
    const token = localStorage.getItem('doctorToken');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/doctor/tokens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTokens(response.data);
    } catch (err) {
      setError(t('errors.networkError') || 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    const token = localStorage.getItem('doctorToken');
    const doctorInfo = localStorage.getItem('doctorInfo');

    if (!token || !doctorInfo) {
      navigate('/doctor/login');
      return;
    }

    const doctor = JSON.parse(doctorInfo);
    setDoctor(doctor);
    fetchTokens(token);

    // Socket.io connection for real-time updates
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join-doctor-room', doctor.id);
    });

    socket.on('queue:updated', (newTokens) => {
      console.log('Queue updated via socket:', newTokens.length);
      setTokens(newTokens);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const updateTokenStatus = async (tokenId, status, extraData = {}) => {
    const token = localStorage.getItem('doctorToken');
    try {
      await axios.put(`${API_URL}/doctor/tokens/${tokenId}`, { status, ...extraData }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // fetchTokens not needed - socket will update
    } catch (err) {
      setError(t('common.updateFailed') || 'Failed to update token');
    }
  };

  const handleCompleteConsultation = async () => {
    if (!selectedToken) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('doctorToken');
      await axios.put(`${API_URL}/doctor/tokens/${selectedToken.id}`, {
        status: 'completed',
        clinical_notes: consultationData.clinicalNotes,
        prescription: consultationData.medications.filter(m => m.drugName.trim())
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setSelectedToken(null);
      // fetchTokens not needed - socket will update
    } catch (err) {
      setError('Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorInfo');
    navigate('/doctor/login');
  };

  const handleStartConsultation = (token) => {
    setSelectedToken(token);
    // Load existing ai_analysis if available
    let aiData = {};
    try {
      aiData = token.ai_analysis ? JSON.parse(token.ai_analysis) : {};
    } catch (e) {
      aiData = {};
    }
    setConsultationData({
      clinicalNotes: '',
      medications: [{ drugName: '', dosage: '', frequency: '', duration: '' }],
    });
    setIsModalOpen(true);
  };

  const addMedication = () => {
    setConsultationData(prev => ({
      ...prev,
      medications: [...prev.medications, { drugName: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const removeMedication = (index) => {
    if (consultationData.medications.length <= 1) return;
    setConsultationData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedication = (index, field, value) => {
    setConsultationData(prev => ({
      ...prev,
      medications: prev.medications.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  // Parse AI analysis from token
  const parseAIAnalysis = (token) => {
    if (!token.ai_analysis) return null;
    try {
      return JSON.parse(token.ai_analysis);
    } catch {
      return null;
    }
  };

  // Deduplicate tokens by unique ID and filter
  const deduplicatedTokens = useMemo(() => {
    const seen = new Set();
    return tokens.filter(token => {
      if (seen.has(token.id)) return false;
      seen.add(token.id);
      return true;
    });
  }, [tokens]);

  // Filter tokens based on search and status
  const filteredTokens = useMemo(() => {
    return deduplicatedTokens.filter(token => {
      const matchesSearch = searchQuery === '' ||
        token.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.token_number.toString().includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'urgent' && token.priority === 'urgent') ||
        token.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [deduplicatedTokens, searchQuery, statusFilter]);

  const getPriorityColor = (priority) => {
    return priority === 'urgent' ? '#ef4444' : '#22c55e';
  };

  const getStatusStyle = (status) => {
    const styles = {
      waiting: { bg: '#fef3c7', color: '#92400e' },
      in_consultation: { bg: '#dbeafe', color: '#1e40af' },
      completed: { bg: '#d1fae5', color: '#065f46' }
    };
    return styles[status] || styles.waiting;
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'urgent': return '🚨 URGENT';
      case 'moderate': return '⚡ MODERATE';
      default: return '✅ NORMAL';
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  // Extract doctor name without "Dr." prefix if already present
  const displayName = doctor?.name?.replace(/^Dr\.\s*/i, '') || '';
  const greetingName = displayName ? `Dr. ${displayName}` : t('doctorDashboard.welcome');

  return (
    <div className="doctor-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="doctor-info">
          <h1>{greetingName}</h1>
          <p>{doctor?.specialization}</p>
        </div>
        <div className="header-actions">
          <LanguageSelector />
          <button className="btn btn-secondary" onClick={handleLogout}>
            {t('common.logout') || 'Logout'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-number">
            {tokens.filter(t => t.status === 'waiting').length}
          </span>
          <span className="stat-label">{t('doctorDashboard.statistics.waiting')}</span>
        </div>
        <div className="stat-card urgent">
          <span className="stat-number">
            {tokens.filter(t => t.priority === 'urgent' && t.status !== 'completed').length}
          </span>
          <span className="stat-label">{t('doctorDashboard.statistics.urgent')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {tokens.filter(t => t.status === 'in_consultation').length}
          </span>
          <span className="stat-label">{t('doctorDashboard.statistics.inConsultation')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {tokens.filter(t => t.status === 'completed').length}
          </span>
          <span className="stat-label">{t('doctorDashboard.statistics.completed')}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Patient Queue with Search & Filters */}
      <div className="tokens-container">
        <div className="queue-header">
          <h2>{t('doctorDashboard.tokens.title')}</h2>
          <div className="queue-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder={t('doctorDashboard.searchPlaceholder') || 'Search by name or token #'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <div className="filter-tabs" role="tablist">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  role="tab"
                  aria-selected={statusFilter === filter.key}
                  className={`filter-tab ${statusFilter === filter.key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(filter.key)}
                >
                  <span className="filter-icon">{filter.icon}</span>
                  <span>{t(`doctorDashboard.filters.${filter.key}`) || filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredTokens.length === 0 ? (
          <div className="no-tokens">
            <p>{searchQuery || statusFilter !== 'all' 
              ? (t('doctorDashboard.noResults') || 'No matching patients found')
              : (t('doctorDashboard.tokens.noTokens') || 'No patients in queue')}</p>
          </div>
        ) : (
          <div className="tokens-list">
            {filteredTokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                aiAnalysis={parseAIAnalysis(token)}
                onStartConsultation={handleStartConsultation}
                onUpdateStatus={updateTokenStatus}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      <button
        className="refresh-btn"
        onClick={fetchTokens}
      >
        ↻ {t('doctorDashboard.refresh')}
      </button>

      {/* E-Prescription Modal */}
      {isModalOpen && selectedToken && (
        <ConsultationModal
          token={selectedToken}
          aiAnalysis={parseAIAnalysis(selectedToken)}
          consultationData={consultationData}
          onClose={() => { setIsModalOpen(false); setSelectedToken(null); }}
          onSave={handleCompleteConsultation}
          onAddMedication={addMedication}
          onRemoveMedication={removeMedication}
          onUpdateMedication={updateMedication}
          onUpdateNotes={(notes) => setConsultationData(prev => ({ ...prev, clinicalNotes: notes }))}
          saving={saving}
          t={t}
        />
      )}
    </div>
  );
}

// Token Card Component with formatted AI Analysis
function TokenCard({ token, aiAnalysis, onStartConsultation, onUpdateStatus, t }) {
  const statusStyle = {
    waiting: { bg: '#fef3c7', color: '#92400e' },
    in_consultation: { bg: '#dbeafe', color: '#1e40af' },
    completed: { bg: '#d1fae5', color: '#065f46' }
  }[token.status] || { bg: '#fef3c7', color: '#92400e' };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'urgent': return { label: '🚨 URGENT', className: 'urgency-urgent' };
      case 'moderate': return { label: '⚡ MODERATE', className: 'urgency-moderate' };
      default: return { label: '✅ NORMAL', className: 'urgency-normal' };
    }
  };

  const urgency = getUrgencyLabel(aiAnalysis?.urgency || token.priority);

  return (
    <div className={`token-item ${token.priority === 'urgent' ? 'urgent' : ''}`}>
      <div className="token-header">
        <span className="token-number">#{token.token_number}</span>
        <span className={`priority-badge ${urgency.className}`}>
          {urgency.label}
        </span>
        <span
          className="status-badge"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {token.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="token-body">
        <div className="patient-info">
          <h3>{token.patient_name}</h3>
          <p>{token.patient_age} years • {token.patient_gender}</p>
        </div>

        <div className="symptoms">
          <strong>{t('patientPortal.token.symptoms')}:</strong>
          <p>{token.symptoms}</p>
        </div>

        {/* Formatted AI Analysis Card */}
        {aiAnalysis && (
          <div className="ai-analysis-card">
            <div className="ai-analysis-header">
              <h4>🤖 {t('doctorDashboard.tokens.aiAnalysis')}</h4>
              <span className={`urgency-badge ${urgency.className}`}>
                {urgency.label}
              </span>
            </div>

            <div className="ai-analysis-content">
              {/* Recommended Specialist */}
              <div className="ai-field">
                <label>{t('doctorDashboard.ai.specialist') || 'Recommended Specialist'}</label>
                <span className="ai-value">{aiAnalysis.recommendedSpecialist || aiAnalysis.recommended || 'General Physician'}</span>
              </div>

              {/* Detected Cluster */}
              <div className="ai-field">
                <label>{t('doctorDashboard.ai.cluster') || 'Symptom Cluster'}</label>
                <span className="ai-value">{aiAnalysis.detectedCluster ? aiAnalysis.detectedCluster.charAt(0).toUpperCase() + aiAnalysis.detectedCluster.slice(1) : 'General'}</span>
              </div>

              {/* Analysis Summary */}
              {aiAnalysis.analysisSummary && (
                <div className="ai-field full-width">
                  <label>{t('doctorDashboard.ai.summary') || 'Analysis Summary'}</label>
                  <p className="ai-summary">{aiAnalysis.analysisSummary}</p>
                </div>
              )}

              {/* Predicted Conditions with Animated Progress Bars */}
              {aiAnalysis.predictedConditions && aiAnalysis.predictedConditions.length > 0 && (
                <div className="ai-field full-width">
                  <label>{t('doctorDashboard.ai.conditions') || 'Predicted Conditions'}</label>
                  <div className="conditions-list">
                    {aiAnalysis.predictedConditions.map((cond, i) => (
                      <div key={i} className="condition-item">
                        <div className="condition-header">
                          <span className="condition-name">{cond.name}</span>
                          <span className="condition-confidence">{cond.confidence}%</span>
                        </div>
                        <div className="confidence-bar">
                          <div 
                            className={`confidence-fill ${cond.confidence > 70 ? 'high' : cond.confidence > 40 ? 'medium' : 'low'}`}
                            style={{ width: '0%' }}
                            data-width={cond.confidence}
                          ></div>
                        </div>
                        <p className="condition-desc">{cond.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="token-actions">
        {token.status === 'waiting' && (
          <>
            <button
              className="btn btn-primary"
              onClick={() => onStartConsultation(token)}
            >
              {t('doctorDashboard.tokens.startConsultation')}
            </button>
            {token.priority === 'urgent' && (
              <button
                className="btn btn-urgent"
                onClick={() => onStartConsultation(token)}
              >
                {t('doctorDashboard.tokens.priorityCall') || 'Priority Call'}
              </button>
            )}
          </>
        )}
        {token.status === 'in_consultation' && (
          <button
            className="btn btn-success"
            onClick={() => onUpdateStatus(token.id, 'completed')}
          >
            {t('doctorDashboard.tokens.completeConsultation')}
          </button>
        )}
        {token.status === 'completed' && (
          <span className="completed-text">✓ {t('common.done') || 'Done'}</span>
        )}
      </div>
    </div>
  );
}

// Consultation Modal with E-Prescription
function ConsultationModal({ 
  token, aiAnalysis, consultationData, onClose, onSave, 
  onAddMedication, onRemoveMedication, onUpdateMedication, onUpdateNotes,
  saving, t 
}) {
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    setAnimateBars(true);
    // Cleanup on close
    return () => setAnimateBars(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🩺 {t('doctorDashboard.modal.title') || 'Consultation & E-Prescription'}</h2>
          <span className="modal-token">Token #{token.token_number}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Patient Info Panel */}
          <div className="patient-panel">
            <h3>👤 {t('doctorDashboard.modal.patientInfo') || 'Patient Information'}</h3>
            <div className="patient-grid">
              <div><label>{t('patientPortal.token.name')}</label> <span>{token.patient_name}</span></div>
              <div><label>{t('patientPortal.token.age')}</label> <span>{token.patient_age} {t('common.years')}</span></div>
              <div><label>{t('patientPortal.token.gender')}</label> <span>{token.patient_gender}</span></div>
              <div><label>{t('patientPortal.token.symptoms')}</label> <span>{token.symptoms}</span></div>
            </div>
          </div>

          {/* AI Analysis Summary in Modal */}
          {aiAnalysis && (
            <div className="ai-summary-panel">
              <h3>🤖 {t('doctorDashboard.tokens.aiAnalysis')}</h3>
              <div className="ai-summary-grid">
                <div className="ai-summary-field">
                  <label>{t('doctorDashboard.ai.specialist')}</label>
                  <span>{aiAnalysis.recommendedSpecialist || aiAnalysis.recommended || 'General Physician'}</span>
                </div>
                <div className="ai-summary-field">
                  <label>{t('doctorDashboard.ai.urgency')}</label>
                  <span className={`urgency-badge ${getUrgencyClass(aiAnalysis.urgency)}`}>
                    {getUrgencyLabelText(aiAnalysis.urgency)}
                  </span>
                </div>
                <div className="ai-summary-field">
                  <label>{t('doctorDashboard.ai.cluster')}</label>
                  <span>{aiAnalysis.detectedCluster ? aiAnalysis.detectedCluster.charAt(0).toUpperCase() + aiAnalysis.detectedCluster.slice(1) : 'General'}</span>
                </div>
                <div className="ai-summary-field">
                  <label>{t('doctorDashboard.ai.topCondition')}</label>
                  <span>{aiAnalysis.predictedConditions?.[0]?.name || 'N/A'} ({aiAnalysis.predictedConditions?.[0]?.confidence || 0}%)</span>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Notes */}
          <div className="form-section">
            <label>{t('doctorDashboard.modal.clinicalNotes') || 'Clinical Notes'}</label>
            <textarea
              value={consultationData.clinicalNotes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder={t('doctorDashboard.modal.notesPlaceholder') || 'Enter clinical findings, diagnosis, advice...'}
              rows="4"
              className="clinical-notes"
            />
          </div>

          {/* E-Prescription */}
          <div className="form-section">
            <div className="section-header">
              <h3>💊 {t('doctorDashboard.modal.prescription') || 'E-Prescription'}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={addMedication}>
                + {t('doctorDashboard.modal.addMedication') || 'Add Medication'}
              </button>
            </div>

            <div className="prescription-table">
              <div className="prescription-header">
                <span className="col-drug">{t('doctorDashboard.modal.drug') || 'Drug Name'}</span>
                <span className="col-dosage">{t('doctorDashboard.modal.dosage') || 'Dosage'}</span>
                <span className="col-frequency">{t('doctorDashboard.modal.frequency') || 'Frequency'}</span>
                <span className="col-duration">{t('doctorDashboard.modal.duration') || 'Duration'}</span>
                <span className="col-actions"></span>
              </div>

              {consultationData.medications.map((med, index) => (
                <div key={index} className="prescription-row">
                  <input
                    type="text"
                    className="prescription-input col-drug"
                    placeholder={t('doctorDashboard.modal.drugPlaceholder') || 'e.g., Paracetamol'}
                    value={med.drugName}
                    onChange={(e) => onUpdateMedication(index, 'drugName', e.target.value)}
                  />
                  <input
                    type="text"
                    className="prescription-input col-dosage"
                    placeholder={t('doctorDashboard.modal.dosagePlaceholder') || 'e.g., 500mg'}
                    value={med.dosage}
                    onChange={(e) => onUpdateMedication(index, 'dosage', e.target.value)}
                  />
                  <select
                    className="prescription-input col-frequency"
                    value={med.frequency}
                    onChange={(e) => onUpdateMedication(index, 'frequency', e.target.value)}
                  >
                    <option value="">{t('doctorDashboard.modal.selectFrequency') || 'Frequency'}</option>
                    <option value="OD">{t('doctorDashboard.modal.od') || 'OD - Once Daily'}</option>
                    <option value="BD">{t('doctorDashboard.modal.bd') || 'BD - Twice Daily'}</option>
                    <option value="TDS">{t('doctorDashboard.modal.tds') || 'TDS - Three Times Daily'}</option>
                    <option value="QID">{t('doctorDashboard.modal.qid') || 'QID - Four Times Daily'}</option>
                    <option value="SOS">{t('doctorDashboard.modal.sos') || 'SOS - As Needed'}</option>
                    <option value="HS">{t('doctorDashboard.modal.hs') || 'HS - At Bedtime'}</option>
                  </select>
                  <input
                    type="text"
                    className="prescription-input col-duration"
                    placeholder={t('doctorDashboard.modal.durationPlaceholder') || 'e.g., 5 days'}
                    value={med.duration}
                    onChange={(e) => onUpdateMedication(index, 'duration', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-icon btn-remove"
                    onClick={() => removeMedication(index)}
                    disabled={consultationData.medications.length <= 1}
                    aria-label={t('common.remove') || 'Remove'}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel') || 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('common.saving') : (t('doctorDashboard.modal.saveComplete') || 'Save & Mark Completed')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getUrgencyClass(urgency) {
  switch (urgency) {
    case 'urgent': return 'urgency-urgent';
    case 'moderate': return 'urgency-moderate';
    default: return 'urgency-normal';
  }
}

function getUrgencyLabelText(urgency) {
  switch (urgency) {
    case 'urgent': return '🚨 URGENT';
    case 'moderate': return '⚡ MODERATE';
    default: return '✅ NORMAL';
  }
}

export default DoctorDashboard;