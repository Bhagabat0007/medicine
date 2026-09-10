import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';

function KioskView() {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState([]);
  const [currentServing, setCurrentServing] = useState(null);
  const [nextUp, setNextUp] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Kiosk socket connected:', socket.id);
      setConnected(true);
      socket.emit('join-kiosk-room');
    });

    socket.on('kiosk:updated', (newTokens) => {
      console.log('Kiosk queue updated:', newTokens.length);
      setTokens(newTokens);
      updateKioskDisplay(newTokens);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateKioskDisplay = (allTokens) => {
    const inConsultation = allTokens
      .filter(t => t.status === 'in_consultation')
      .sort((a, b) => a.token_number - b.token_number);
    
    const waiting = allTokens
      .filter(t => t.status === 'waiting')
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, moderate: 1, normal: 2 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2) || a.token_number - b.token_number;
      });

    setCurrentServing(inConsultation[0] || null);
    setNextUp([...waiting.slice(0, 5), ...inConsultation.slice(1, 3)].slice(0, 6));
  };

  const getUrgencyLabel = (priority) => {
    switch (priority) {
      case 'urgent': return { label: '🚨 URGENT', className: 'urgency-urgent' };
      case 'moderate': return { label: '⚡ MODERATE', className: 'urgency-moderate' };
      default: return { label: '✅ NORMAL', className: 'urgency-normal' };
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="kiosk-view">
      <header className="kiosk-header">
        <div className="kiosk-title">
          <h1>🏥 {t('kiosk.title') || 'MediKiosk - Waiting Room Display'}</h1>
          <div className="kiosk-status">
            <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`}></span>
            <span>{connected ? t('kiosk.live') : t('kiosk.offline')}</span>
          </div>
        </div>
        <div className="kiosk-time">
          <div id="kiosk-clock" className="clock">--:--:--</div>
          <div className="date">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </header>

      <main className="kiosk-main">
        {/* Currently Serving */}
        <section className="kiosk-section currently-serving">
          <div className="section-header">
            <h2>🎯 {t('kiosk.currentlyServing') || 'Currently Serving'}</h2>
          </div>
          <div className="token-card large">
            {currentServing ? (
              <>
                <div className="token-main">
                  <div className="token-number-display">#{currentServing.token_number}</div>
                  <div className="patient-name-display">{currentServing.patient_name}</div>
                  <div className="token-meta">
                    <span className={`priority-badge-large ${getUrgencyLabel(currentServing.priority).className}`}>
                      {getUrgencyLabel(currentServing.priority).label}
                    </span>
                    <span className="doctor-name">Dr. {currentServing.doctor_name || 'General Physician'}</span>
                  </div>
                </div>
                <div className="call-action">
                  <button className="btn-call" onClick={() => speakToken(currentServing)}>
                    🔊 {t('kiosk.callPatient') || 'Call Patient'}
                  </button>
                </div>
              </>
            ) : (
              <div className="no-patient">
                <div className="waiting-icon">🏥</div>
                <p>{t('kiosk.noPatientServing') || 'No patient currently being served'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Next Up Tokens */}
        <section className="kiosk-section next-up">
          <div className="section-header">
            <h2>⏭️ {t('kiosk.nextUp') || 'Next Up'}</h2>
          </div>
          <div className="next-tokens-grid">
            {nextUp.length > 0 ? (
              nextUp.map((token, index) => (
                <div key={token.id} className={`next-token-card ${token.priority === 'urgent' ? 'urgent' : ''}`}>
                  <div className="position-badge">
                    {index === 0 ? '🥇 NEXT' : index === 1 ? '🥈 2ND' : index === 2 ? '🥉 3RD' : `${index + 1}TH`}
                  </div>
                  <div className="token-info">
                    <div className="token-number">#{token.token_number}</div>
                    <div className="patient-name">{token.patient_name}</div>
                  </div>
                  <div className="token-details">
                    <span className={`priority-badge-small ${getUrgencyLabel(token.priority).className}`}>
                      {getUrgencyLabel(token.priority).label}
                    </span>
                    <span className="wait-time">~{token.estimated_wait || index * 5} min</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-waiting">
                <p>{t('kiosk.noWaiting') || 'No patients waiting'}</p>
              </div>
            )}
          </div>
        </section>

        {/* All Waiting Tokens (compact) */}
        <section className="kiosk-section all-waiting">
          <div className="section-header">
            <h2>📋 {t('kiosk.allWaiting') || 'All Waiting Tokens'}</h2>
          </div>
          <div className="waiting-list">
            {tokens
              .filter(t => t.status === 'waiting')
              .sort((a, b) => {
                const priorityOrder = { urgent: 0, moderate: 1, normal: 2 };
                return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2) || a.token_number - b.token_number;
              })
              .map((token) => (
                <div key={token.id} className={`waiting-item ${token.priority === 'urgent' ? 'urgent' : ''}`}>
                  <span className="token-num">#{token.token_number}</span>
                  <span className="patient-name">{token.patient_name}</span>
                  <span className={`priority-chip ${getUrgencyLabel(token.priority).className}`}>
                    {getUrgencyLabel(token.priority).label}
                  </span>
                  <span className="est-wait">~{token.estimated_wait || 0} min</span>
                </div>
              ))}
          </div>
        </section>
      </main>

      <footer className="kiosk-footer">
        <p>{t('kiosk.footer') || 'MediKiosk - AI-Powered Medical Queue Management'}</p>
      </footer>
    </div>
  );
}

function speakToken(token) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(
      `Token number ${token.token_number}, ${token.patient_name}, please proceed to consultation room`
    );
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  }
}

// Clock update
if (typeof window !== 'undefined') {
  setInterval(() => {
    const clock = document.getElementById('kiosk-clock');
    if (clock) {
      clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }, 1000);
}

export default KioskView;