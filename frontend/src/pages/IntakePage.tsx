import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Check } from 'lucide-react';
import KioskLayout from '../components/layout/KioskLayout';
import QuestionCard from '../components/interview/QuestionCard';
import ChoiceQuestion from '../components/interview/ChoiceQuestion';
import ScaleQuestion from '../components/interview/ScaleQuestion';
import ConversationView from '../components/interview/ConversationView';
import VoiceButton from '../components/voice/VoiceButton';
import ListeningIndicator from '../components/voice/ListeningIndicator';
import RedFlagAlert from '../components/emergency/RedFlagAlert';
import { useStore } from '../store/useStore';

export default function IntakePage() {
  const navigate = useNavigate();
  const {
    addConversationMessage,
    setInterviewProgress,
    setListening,
    setEmergency,
    setPriority,
    setCurrentStep,
    addSymptom,
    beginInterview,
    answerQuestion,
    session,
  } = useStore();

  const currentQuestion = session.currentQuestion;

  const [textInput, setTextInput] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [scaleValue, setScaleValue] = useState(5);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    setCurrentStep(4);
    if (!startedRef.current) {
      startedRef.current = true;
      beginInterview()
        .then((q) => {
          if (q) {
            addConversationMessage('ai', q.text);
          } else {
            navigate('/documents');
          }
        })
        .catch(() => setError('Could not start the interview. Please try again.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = useCallback(async () => {
    if (!currentQuestion) return;

    let answerText = '';
    let inputType: 'voice' | 'text' | 'touch' = 'text';

    if (showTranscript && transcript) {
      answerText = transcript;
      inputType = 'voice';
    } else if (currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') {
      answerText = selectedOptions.join(', ');
      inputType = 'touch';
    } else if (currentQuestion.type === 'scale') {
      answerText = `${scaleValue}`;
      inputType = 'touch';
    } else if (currentQuestion.type === 'yes_no') {
      answerText = selectedOptions[0] || '';
      inputType = 'touch';
    } else if (currentQuestion.type === 'number') {
      answerText = textInput;
      inputType = 'text';
    } else {
      answerText = textInput;
      inputType = 'text';
    }

    if (!answerText.trim() && !showTranscript) return;

    setIsLoading(true);
    setError('');
    addConversationMessage('patient', answerText);
    addSymptom({
      id: currentQuestion.question_id,
      name: currentQuestion.text,
      severity: currentQuestion.type === 'scale' ? scaleValue : undefined,
    });

    try {
      const { next, completed } = await answerQuestion(currentQuestion.question_id, answerText, inputType);

      if (session.priority === 'urgent' && (currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice')) {
        setEmergency(true);
        setPriority('urgent');
        setShowEmergency(true);
        setIsLoading(false);
        return;
      }

      if (completed || !next) {
        setInterviewProgress(100);
        navigate('/documents');
        return;
      }

      addConversationMessage('ai', next.text);
      setTextInput('');
      setSelectedOptions([]);
      setTranscript('');
      setShowTranscript(false);
      setIsListening(false);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, textInput, selectedOptions, scaleValue, transcript, showTranscript, session.priority]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = session.language === 'hi' ? 'hi-IN' : session.language === 'or' ? 'or-IN' : session.language === 'bn' ? 'bn-IN' : 'en-US';

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      setTranscript(text);
      if (event.results[last].isFinal) {
        setShowTranscript(true);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleEditTranscript = () => {
    setShowTranscript(false);
    setTranscript('');
    setTextInput('');
  };

  if (showEmergency) {
    return <RedFlagAlert onCallStaff={() => { setShowEmergency(false); navigate('/submitted'); }} />;
  }

  if (isLoading) {
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-6">
          <div className="text-4xl">🤖</div>
          <p className="text-xl text-navy-600">Preparing the next question...</p>
          <div className="flex gap-2">
            <span className="w-3 h-3 bg-primary-400 rounded-full typing-dot-1" />
            <span className="w-3 h-3 bg-primary-400 rounded-full typing-dot-2" />
            <span className="w-3 h-3 bg-primary-400 rounded-full typing-dot-3" />
          </div>
        </div>
      </KioskLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <KioskLayout>
        <div className="flex flex-col items-center text-center max-w-lg mx-auto gap-6">
          <p className="text-xl text-navy-600">{error || 'Loading...'}</p>
        </div>
      </KioskLayout>
    );
  }

  const renderInput = () => {
    switch (currentQuestion.type) {
      case 'voice':
      case 'text':
        if (showTranscript && transcript) {
          return (
            <div className="flex flex-col items-center gap-4 w-full">
              <p className="text-sm text-navy-500 uppercase tracking-wide font-medium">You said:</p>
              <p className="text-xl text-navy-800 italic bg-white rounded-2xl border border-navy-200 p-4 w-full text-center">
                "{transcript}"
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleEditTranscript}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-navy-200 text-navy-700 text-lg font-semibold py-4 rounded-2xl hover:bg-navy-50 min-h-[64px]"
                >
                  <Pencil className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-lg font-semibold py-4 rounded-2xl min-h-[64px]"
                >
                  <Check className="w-5 h-5" />
                  That's correct
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center gap-6 w-full">
            {isListening ? (
              <ListeningIndicator />
            ) : (
              <VoiceButton isListening={isListening} onToggle={toggleListening} />
            )}
            <p className="text-base text-navy-400">
              {isListening ? 'Speak now...' : 'Tap to speak'}
            </p>
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-navy-200" />
              <span className="text-sm text-navy-400">or</span>
              <div className="flex-1 h-px bg-navy-200" />
            </div>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && textInput.trim() && handleNext()}
              placeholder="Type your answer..."
              className="w-full border-2 border-navy-200 rounded-2xl px-5 py-4 text-lg focus:border-primary-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleNext}
              disabled={!textInput.trim() && !transcript}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-2xl min-h-[64px]"
            >
              Continue
            </button>
            {error && <p className="text-danger-500 text-base">{error}</p>}
          </div>
        );

      case 'single_choice':
        return (
          <div className="flex flex-col gap-4 w-full">
            <ChoiceQuestion
              options={currentQuestion.options || []}
              selected={selectedOptions}
              onSelect={(vals) => setSelectedOptions(vals)}
            />
            <button
              onClick={handleNext}
              disabled={selectedOptions.length === 0}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-2xl min-h-[64px]"
            >
              Continue
            </button>
            {error && <p className="text-danger-500 text-base">{error}</p>}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="flex flex-col gap-4 w-full">
            <ChoiceQuestion
              options={currentQuestion.options || []}
              multiple
              selected={selectedOptions}
              onSelect={(vals) => setSelectedOptions(vals)}
            />
            <button
              onClick={handleNext}
              disabled={selectedOptions.length === 0}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-2xl min-h-[64px]"
            >
              Continue
            </button>
            {error && <p className="text-danger-500 text-base">{error}</p>}
          </div>
        );

      case 'scale':
        return (
          <div className="flex flex-col gap-4 w-full">
            <ScaleQuestion
              min={currentQuestion.min}
              max={currentQuestion.max}
              minLabel={currentQuestion.minLabel}
              maxLabel={currentQuestion.maxLabel}
              value={scaleValue}
              onChange={setScaleValue}
            />
            <button
              onClick={handleNext}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white text-lg font-bold py-4 rounded-2xl min-h-[64px]"
            >
              Continue
            </button>
            {error && <p className="text-danger-500 text-base">{error}</p>}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex flex-col gap-3 w-full">
            <ChoiceQuestion
              options={['Yes', 'No']}
              selected={selectedOptions}
              onSelect={(vals) => setSelectedOptions(vals)}
            />
            <button
              onClick={handleNext}
              disabled={selectedOptions.length === 0}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-2xl min-h-[64px]"
            >
              Continue
            </button>
            {error && <p className="text-danger-500 text-base">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div className="flex flex-col gap-4 w-full">
            <input
              type="number"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter a number"
              className="w-full border-2 border-navy-200 rounded-2xl px-5 py-4 text-2xl text-center focus:border-primary-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleNext}
              disabled={!textInput.trim()}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-navy-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-2xl min-h-[64px]"
            >
              Continue
            </button>
            {error && <p className="text-danger-500 text-base">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <KioskLayout>
      <div className="flex flex-col items-center w-full max-w-lg mx-auto gap-6">
        <ConversationView messages={session.conversation.slice(0, -1)} />

        <QuestionCard
          text={currentQuestion.text}
          subtext={currentQuestion.subtext}
        />

        {renderInput()}
      </div>
    </KioskLayout>
  );
}
