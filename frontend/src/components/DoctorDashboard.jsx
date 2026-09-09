import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = '/api';

function DoctorDashboard() {
  const [tokens, setTokens] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('doctorToken');
    const doctorInfo = localStorage.getItem('doctorInfo');

    if (!token || !doctorInfo) {
      navigate('/doctor/login');
      return;
    }

    setDoctor(JSON.parse(doctorInfo));
    fetchTokens(token);
  }, [navigate]);

  const fetchTokens = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/doctor/tokens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTokens(response.data);
    } catch (err) {
      setError('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const updateTokenStatus = async (tokenId, status) => {
    const token = localStorage.getItem('doctorToken');
    try {
      await axios.put(`${API_URL}/doctor/tokens/${tokenId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTokens(token);
    } catch (err) {
      setError('Failed to update token');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorInfo');
    navigate('/doctor/login');
  };

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

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <div className="doctor-info">
          <h1>Welcome, {doctor?.name}</h1>
          <p>{doctor?.specialization}</p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-number">
            {tokens.filter(t => t.status === 'waiting').length}
          </span>
          <span className="stat-label">Waiting</span>
        </div>
        <div className="stat-card urgent">
          <span className="stat-number">
            {tokens.filter(t => t.priority === 'urgent' && t.status !== 'completed').length}
          </span>
          <span className="stat-label">Urgent</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {tokens.filter(t => t.status === 'in_consultation').length}
          </span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {tokens.filter(t => t.status === 'completed').length}
          </span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tokens-container">
        <h2>Today's Queue</h2>

        {tokens.length === 0 ? (
          <div className="no-tokens">
            <p>No tokens for today</p>
          </div>
        ) : (
          <div className="tokens-list">
            {tokens.map((token) => (
              <div
                key={token.id}
                className={`token-item ${token.priority === 'urgent' ? 'urgent' : ''}`}
              >
                <div className="token-header">
                  <span className="token-number">#{token.token_number}</span>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(token.priority) }}
                  >
                    {token.priority.toUpperCase()}
                  </span>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusStyle(token.status).bg,
                      color: getStatusStyle(token.status).color
                    }}
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
                    <strong>Symptoms:</strong>
                    <p>{token.symptoms}</p>
                  </div>

                  {token.ai_analysis && (
                    <div className="ai-analysis">
                      <strong>AI Analysis:</strong>
                      <pre>{JSON.stringify(JSON.parse(token.ai_analysis), null, 2)}</pre>
                    </div>
                  )}
                </div>

                <div className="token-actions">
                  {token.status === 'waiting' && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => updateTokenStatus(token.id, 'in_consultation')}
                      >
                        Start Consultation
                      </button>
                      {token.priority === 'urgent' && (
                        <button
                          className="btn btn-urgent"
                          onClick={() => updateTokenStatus(token.id, 'in_consultation')}
                        >
                          Priority Call
                        </button>
                      )}
                    </>
                  )}
                  {token.status === 'in_consultation' && (
                    <button
                      className="btn btn-success"
                      onClick={() => updateTokenStatus(token.id, 'completed')}
                    >
                      Complete
                    </button>
                  )}
                  {token.status === 'completed' && (
                    <span className="completed-text">✓ Done</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="refresh-btn"
        onClick={() => fetchTokens(localStorage.getItem('doctorToken'))}
      >
        ↻ Refresh Queue
      </button>
    </div>
  );
}

export default DoctorDashboard;
