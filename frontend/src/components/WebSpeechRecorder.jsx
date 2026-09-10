import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

function WebSpeechRecorder({ onTranscribe, autoStart = false }) {
  const { t } = useTranslation();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript,
    error,
    browserSupported,
    permissionStatus,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: 'en-US',
    autoRestart: true,
    restartDelay: 500,
    onResult: (text, isFinal) => {
      if (isFinal) {
        onTranscribe(text);
      }
    },
    onError: (err, msg) => {
      console.log('Speech error:', err, msg);
    },
    onEnd: () => {
      console.log('Speech recognition ended');
    },
  });

  const handleStart = useCallback(async () => {
    setHasInteracted(true);
    if (permissionStatus === 'prompt') {
      const granted = await requestPermission();
      if (!granted) {
        setShowPermissionDialog(true);
        return;
      }
    }
    startListening();
  }, [permissionStatus, requestPermission, startListening]);

  const handleStop = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleReset = useCallback(() => {
    resetTranscript();
    onTranscribe('');
  }, [resetTranscript, onTranscribe]);

  useEffect(() => {
    if (autoStart && !hasInteracted) {
      handleStart();
    }
  }, [autoStart, hasInteracted, handleStart]);

  if (!browserSupported) {
    return (
      <div className="web-speech-unsupported">
        <h3>⚠️ {t('errors.speechNotSupported')}</h3>
        <p>{t('common.browserNotSupported') || 'Your browser doesn\'t support Web Speech API.'}</p>
        <p className="hint">{t('common.tryChromeEdge') || 'Try Chrome, Edge, or Safari for voice input.'}</p>
      </div>
    );
  }

  const displayText = fullTranscript || transcript;
  const isActive = isListening || permissionStatus === 'prompt';

  return (
    <div className={`web-speech-recorder ${isListening ? 'listening' : ''}`}>
      <div className="recorder-header">
        <h3>🎤 {t('patientPortal.symptoms.browserMode')}</h3>
        <span className={`status-badge ${permissionStatus}`}>
          {permissionStatus === 'granted' ? t('common.ready') : 
           permissionStatus === 'denied' ? t('common.blocked') : t('common.clickToEnable')}
        </span>
      </div>

      {error && (
        <div className="recorder-error">
          {error}
          {permissionStatus === 'denied' && (
            <button onClick={handleStart} className="btn-retry">
              {t('patientPortal.symptoms.enableMicrophone')}
            </button>
          )}
        </div>
      )}

      <div className="recorder-controls">
        {!isListening && (
          <button
            type="button"
            className="btn btn-record"
            onClick={handleStart}
            disabled={permissionStatus === 'denied'}
          >
            <span className="mic-icon">🎙️</span>
            <span>{permissionStatus === 'prompt' ? t('patientPortal.symptoms.enableMicrophone') : t('patientPortal.symptoms.startRecording')}</span>
          </button>
        )}

        {isListening && (
          <button
            type="button"
            className="btn btn-stop"
            onClick={handleStop}
          >
            <span className="mic-icon recording">⏹️</span>
            <span>{t('patientPortal.symptoms.stopRecording')}</span>
            <div className="listening-indicator">
              <span className="pulse-dot"></span>
              <span className="pulse-dot"></span>
              <span className="pulse-dot"></span>
              {t('patientPortal.symptoms.listening')}
            </div>
          </button>
        )}
      </div>

      {(displayText || transcript) && (
        <div className="transcript-preview">
          <div className="transcript-content">
            {transcript && <span className="final-text">{transcript}</span>}
            {interimTranscript && <span className="interim-text">{interimTranscript}</span>}
          </div>
          <div className="transcript-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset}>
              {t('patientPortal.symptoms.clear')}
            </button>
            {!isListening && (
              <button type="button" className="btn btn-primary btn-sm" onClick={handleStart}>
                {t('patientPortal.symptoms.reRecord')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="recorder-tips">
        <details>
          <summary>{t('patientPortal.symptoms.tipsTitle') || '💡 Tips for best results'}</summary>
          <ul>
            <li>{t('patientPortal.symptoms.tip1')}</li>
            <li>{t('patientPortal.symptoms.tip2')}</li>
            <li>{t('patientPortal.symptoms.tip3')}</li>
            <li>{t('patientPortal.symptoms.tip4')}</li>
            <li>{t('patientPortal.symptoms.tip5')}</li>
          </ul>
        </details>
      </div>

      {showPermissionDialog && (
        <div className="permission-modal-overlay" onClick={() => setShowPermissionDialog(false)}>
          <div className="permission-modal" onClick={e => e.stopPropagation()}>
            <h3>🎤 {t('common.micPermissionRequired') || 'Microphone Permission Required'}</h3>
            <p>{t('common.micPermissionText') || 'Voice input needs microphone access. Please:'}</p>
            <ol>
              <li>{t('common.micStep1') || 'Click the lock/icon in your browser\'s address bar'}</li>
              <li>{t('common.micStep2') || 'Set Microphone to "Allow"'}</li>
              <li>{t('common.micStep3') || 'Reload this page'}</li>
            </ol>
            <div className="modal-actions">
              <button onClick={() => setShowPermissionDialog(false)} className="btn btn-primary">
                {t('common.gotIt') || 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebSpeechRecorder;