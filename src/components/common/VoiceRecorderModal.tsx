import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check, AlertCircle } from 'lucide-react';
import { AttachmentMeta } from '../../types/vent';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVoiceDump: (transcription: string, attachment: AttachmentMeta) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onSaveVoiceDump,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscript('');
    setMicError(null);
  };

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    setTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Attempt live SpeechRecognition if available in browser
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' ';
          }
          setTranscript(text.trim());
        };
        recognition.onerror = () => {};
        recognition.start();
        speechRecognitionRef.current = recognition;
      }
    } catch (err: any) {
      console.warn('Microphone access issue:', err);
      setMicError('Microphone access denied or unavailable. You can type your vent directly.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  const handleSave = async () => {
    if (!audioBlob) return;

    // Convert blob to base64 dataUrl for offline attachment persistence
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const attachment: AttachmentMeta = {
        id: `voice_${Date.now()}`,
        name: `Voice Vent (${new Date().toLocaleTimeString()}).webm`,
        mimeType: 'audio/webm',
        size: audioBlob.size,
        dataUrl,
        previewAvailable: true,
        summary: `Voice recording (${recordingSeconds}s). Transcribed locally.`,
        createdAt: Date.now(),
      };

      const finalContent =
        transcript.trim() || `[Voice Vent audio recording, duration: ${recordingSeconds}s]`;
      onSaveVoiceDump(finalContent, attachment);
      onClose();
    };
    reader.readAsDataURL(audioBlob);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100">
        <h3 className="text-base font-semibold">Voice Vent</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Speak your unstructured thoughts naturally. Audio and transcription will be captured locally.
        </p>

        {micError ? (
          <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{micError}</span>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center">
            {/* Pulsing visualizer circle */}
            <div
              className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all ${
                isRecording
                  ? 'bg-rose-950/50 border-2 border-rose-500 animate-pulse'
                  : 'bg-neutral-800 border border-neutral-700'
              }`}
            >
              <Mic
                className={`w-8 h-8 ${isRecording ? 'text-rose-400' : 'text-neutral-300'}`}
              />
            </div>

            <div className="mt-3 text-sm font-mono text-neutral-300">
              {formatTime(recordingSeconds)}
            </div>

            {/* Transcript Area */}
            <div className="mt-4 w-full">
              <label className="text-[11px] text-neutral-400 uppercase font-mono tracking-wider">
                Transcription:
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  isRecording
                    ? 'Listening... speak freely...'
                    : 'Transcription will appear here. You can also edit it.'
                }
                className="mt-1 w-full h-24 p-2.5 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-neutral-600 resize-none"
              />
            </div>

            {/* Audio playback preview if recorded */}
            {audioUrl && !isRecording && (
              <div className="mt-3 w-full flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                <audio
                  ref={audioElementRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (audioElementRef.current) {
                      if (isPlaying) {
                        audioElementRef.current.pause();
                        setIsPlaying(false);
                      } else {
                        audioElementRef.current.play();
                        setIsPlaying(true);
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded transition"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlaying ? 'Pause' : 'Play audio'}</span>
                </button>
                <span className="text-[11px] font-mono text-neutral-400">
                  {formatTime(recordingSeconds)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{audioBlob ? 'Re-record' : 'Start Speaking'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-700 hover:bg-neutral-600 rounded-lg transition"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop Recording</span>
              </button>
            )}

            {audioBlob && !isRecording && (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-lg transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Voice Vent</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
