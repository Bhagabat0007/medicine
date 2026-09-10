import { useState, useRef, useEffect, useCallback } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function useSpeechRecognition(options = {}) {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    onResult,
    onError,
    onEnd,
    autoRestart = true,
    restartDelay = 1000,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);

  useEffect(() => {
    const supported = !!SpeechRecognition;
    setBrowserSupported(supported);
    
    if (!supported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      isManuallyStoppedRef.current = false;
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + ' ' + finalTranscript);
        onResult?.(finalTranscript, true);
      }
      if (interim) {
        setInterimTranscript(interim);
        onResult?.(interim, false);
      }
    };

    recognition.onerror = (event) => {
      const errorMap = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone not accessible. Check permissions.',
        'not-allowed': 'Microphone permission denied. Enable in browser settings.',
        'network': 'Network error. Check connection.',
        'service-not-allowed': 'Speech service not allowed.',
        'bad-grammar': 'Grammar error.',
        'language-not-supported': `Language ${lang} not supported.`,
      };

      const message = errorMap[event.error] || `Error: ${event.error}`;
      setError(message);
      onError?.(event.error, message);

      if (event.error === 'not-allowed') {
        setPermissionStatus('denied');
        stopListening();
      } else if (event.error === 'audio-capture') {
        setPermissionStatus('prompt');
      }

      if (autoRestart && !isManuallyStoppedRef.current && 
          ['no-speech', 'audio-capture', 'network'].includes(event.error)) {
        scheduleRestart();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      onEnd?.();

      if (autoRestart && !isManuallyStoppedRef.current) {
        scheduleRestart();
      }
    };

    recognition.onaudiostart = () => {
      setPermissionStatus('granted');
    };

    recognitionRef.current = recognition;

    return () => {
      stopListening();
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [continuous, interimResults, lang, onResult, onError, onEnd, autoRestart, restartDelay]);

  const scheduleRestart = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    restartTimeoutRef.current = setTimeout(() => {
      if (!isManuallyStoppedRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Restart failed:', e);
        }
      }
    }, restartDelay);
  }, [restartDelay]);

  const startListening = useCallback(() => {
    if (!browserSupported) {
      setError('Speech recognition not supported');
      return;
    }

    isManuallyStoppedRef.current = false;
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        if (e.name === 'InvalidStateError') {
          setTimeout(() => {
            if (!isManuallyStoppedRef.current) {
              try {
                recognitionRef.current?.start();
              } catch (err) {
                setError('Failed to start recognition');
              }
            }
          }, 100);
        } else {
          setError('Failed to start: ' + e.message);
        }
      }
    }
  }, [browserSupported, isListening]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Stop error:', e);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      return true;
    } catch (e) {
      setPermissionStatus('denied');
      setError('Microphone permission denied');
      return false;
    }
  }, []);

  return {
    isListening,
    transcript: transcript.trim(),
    interimTranscript,
    fullTranscript: (transcript + ' ' + interimTranscript).trim(),
    error,
    browserSupported,
    permissionStatus,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
  };
}

export default useSpeechRecognition;