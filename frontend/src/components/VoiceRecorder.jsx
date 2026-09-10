import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../config/api';

function VoiceRecorder({ onTranscribe }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(Math.min(average / 128, 1));
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const startRecording = async () => {
    setError('');
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      updateAudioLevel();
    } catch (err) {
      console.error('Recording error:', err);
      setError(t('errors.micPermissionDenied'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await axios.post(`${API_URL}/voice/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.text) {
        setTranscript(res.data.text);
        onTranscribe(res.data.text);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(t('errors.transcriptionFailed'));
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="voice-recorder">
      <div className="voice-header">
        <h3>🎤 {t('patientPortal.symptoms.voiceInputMethod')}</h3>
        <p className="voice-hint">{t('patientPortal.symptoms.helpText')}</p>
      </div>

      <div className="voice-controls">
        {isTranscribing && (
          <div className="transcribing-state">
            <div className="spinner"></div>
            <span>{t('patientPortal.symptoms.listening')}</span>
          </div>
        )}

        {!isTranscribing && !isRecording && (
          <button
            type="button"
            className="btn btn-voice-record"
            onClick={startRecording}
            disabled={error && !transcript}
          >
            <span className="mic-icon">🎙️</span>
            <span>{t('patientPortal.symptoms.startRecording')}</span>
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            className="btn btn-voice-stop"
            onClick={stopRecording}
          >
            <span className="mic-icon recording">⏹️</span>
            <span>{t('patientPortal.symptoms.stopRecording')}</span>
            <div className="audio-visualizer">
              <div className="bars">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="bar"
                    style={{ 
                      height: `${Math.max(10, audioLevel * 100 * (0.5 + Math.random() * 0.5))}%`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          </button>
        )}

        {transcript && !isRecording && !isTranscribing && (
          <div className="transcript-preview">
            <p>{transcript}</p>
            <div className="transcript-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                setTranscript('');
                onTranscribe('');
              }}>
                {t('patientPortal.symptoms.clear')}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={startRecording}>
                {t('patientPortal.symptoms.reRecord')}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <div className="voice-error">{error}</div>}

      <div className="voice-tips">
        <small>
          {t('patientPortal.symptoms.tips')}
        </small>
      </div>
    </div>
  );
}

export default VoiceRecorder;