import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage, VoicePipelineState, Problem, DesignProblem, CodeLanguage, TestResult, WhiteboardState } from "@ffh/types";
import { AudioQueuePlayer, decodePCM16, createVolumeMeter } from "./audio";

interface UseVoiceOptions {
  interviewId?: string;
  problemId?: string;
  onProblemLoaded?: (problem: Problem) => void;
  onDesignProblemLoaded?: (problem: DesignProblem) => void;
}

interface SolutionComparison {
  userSolution: string;
  optimalSolution: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

interface UseVoiceReturn {
  state: VoicePipelineState;
  micActive: boolean;
  volume: number;
  transcript: string;
  aiText: string;
  error: string | null;
  connected: boolean;
  voiceStarted: boolean;
  hintLevel: number;
  totalHints: number;
  questionCurrent: number;
  questionTotal: number;
  questionStartTime: number;
  recommendedSeconds: number;
  timeWarning: number | null;
  solutionComparison: SolutionComparison | null;
  startVoiceSession: () => void;
  toggleMic: () => void;
  interrupt: () => void;
  sendCodeUpdate: (code: string, language: CodeLanguage) => void;
  sendCodeResult: (results: TestResult[], stdout: string, stderr: string, error?: string) => void;
  sendWhiteboardUpdate: (state: WhiteboardState) => void;
  requestHint: () => void;
  dismissSolution: () => void;
}

function buildWsUrl(interviewId?: string, problemId?: string): string {
  // Development için doğrudan API portuna bağlan
  const base = `ws://localhost:3001/ws/voice`;
  const params = new URLSearchParams();
  if (interviewId) params.set("interviewId", interviewId);
  if (problemId) params.set("problemId", problemId);
  return params.toString() ? `${base}?${params.toString()}` : base;
}

// VAD: balanced settings — natural conversation feel with breathing room
const VAD_THRESHOLD = 0.02; // Sensitive — detect speech quickly
const VAD_SILENCE_MS = 1500; // 1.5s silence → send (gives user time to pause/think)
const VAD_MIN_SPEECH_MS = 250; // 250ms speech minimum
const VAD_SPEECH_CONFIDENCE_MS = 40; // 40ms confidence for speech start

// VAD: interrupt settings — user speaking should stop AI quickly
const VAD_INTERRUPT_THRESHOLD = 0.04; // Lower than before — catch user speech more easily
const VAD_INTERRUPT_SPEECH_MS = 300; // 300ms sustained speech → interrupt AI (was 500ms)
const VAD_INTERRUPT_CONFIDENCE_MS = 60; // 60ms confidence before counting (was 100ms)

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const [state, setState] = useState<VoicePipelineState>("idle");
  const [micActive, setMicActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [voiceStarted, setVoiceStarted] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [totalHints, setTotalHints] = useState(0);
  const [questionCurrent, setQuestionCurrent] = useState(0);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [recommendedSeconds, setRecommendedSeconds] = useState(0);
  const [timeWarning, setTimeWarning] = useState<number | null>(null);
  const [solutionComparison, setSolutionComparison] = useState<SolutionComparison | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const volumeMeterRef = useRef<{ stop: () => void } | null>(null);
  const playerRef = useRef<AudioQueuePlayer>(new AudioQueuePlayer());
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartTimeRef = useRef<number | null>(null);
  const speechConfidenceTimeRef = useRef<number | null>(null);
  const consecutiveSilenceRef = useRef(0);
  const aiTextAccRef = useRef("");
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);
  // Ref to track state for VAD (avoids stale closure in volume meter callback)
  const stateRef = useRef<VoicePipelineState>("idle");

  // ─── WebSocket (with auto-reconnect) ─────────────────

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const wsUrl = buildWsUrl(options.interviewId, options.problemId);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        const msg: ServerMessage = JSON.parse(event.data);
        handleServerMessage(msg);
      };

      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect with exponential backoff (max 10s, max 5 attempts)
        if (!unmountedRef.current && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000);
          reconnectAttemptsRef.current++;
          reconnectTimerRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setError("WebSocket bağlantısı kurulamadı");
      };
    }

    connect();
    playerRef.current.init();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      // Close WebSocket properly
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
      stopMicStream();
      playerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.interviewId, options.problemId]);

  // Keep stateRef in sync with React state (for VAD closure)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  function handleServerMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case "state_change":
        setState(msg.state);
        break;

      case "transcript":
        if (msg.final) setTranscript(msg.text);
        break;

      case "ai_text":
        if (msg.done) {
          // If done message carries full text (e.g. intro), use it directly
          if (msg.text) {
            aiTextAccRef.current = msg.text;
          }
          setAiText(aiTextAccRef.current);
        } else {
          aiTextAccRef.current += msg.text;
          // Throttle UI updates to prevent re-render storm
          if (aiTextAccRef.current.length % 10 === 0 || msg.text.includes(' ')) {
            setAiText(aiTextAccRef.current);
          }
        }
        break;

      case "ai_audio":
        playerRef.current.enqueue(decodePCM16(msg.data));
        break;

      case "ai_audio_done":
        // Playback will finish naturally from queue
        break;

      case "error":
        setError(msg.message);
        break;

      case "problem_loaded":
        console.log("Problem received from WebSocket:", msg.problem);
        options.onProblemLoaded?.(msg.problem);
        break;

      case "design_problem_loaded":
        options.onDesignProblemLoaded?.(msg.problem);
        break;

      case "hint_given":
        setHintLevel(msg.level);
        setTotalHints(msg.totalHints);
        break;

      case "question_update":
        setQuestionCurrent(msg.current);
        setQuestionTotal(msg.total);
        setQuestionStartTime(msg.questionStartTime);
        setRecommendedSeconds(msg.recommendedSeconds);
        break;

      case "time_warning":
        setTimeWarning(msg.minutesLeft);
        break;

      case "solution_comparison":
        setSolutionComparison({
          userSolution: msg.userSolution,
          optimalSolution: msg.optimalSolution,
          timeComplexity: msg.timeComplexity,
          spaceComplexity: msg.spaceComplexity,
        });
        break;
    }
  }

  // ─── Send helper ─────────────────────────────────────

  function send(msg: ClientMessage): void {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  // ─── Start voice session (one-time action) ──────────

  const startVoiceSession = useCallback(async () => {
    if (voiceStarted) return;
    setVoiceStarted(true);
    // toggleMic will open mic and send start_listening (triggers backend intro)
    if (!micActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });
        mediaStreamRef.current = stream;
        setMicActive(true);
        setError(null);
        setTranscript("");
        aiTextAccRef.current = "";
        setAiText("");

        let lastVolumeUpdate = 0;
        volumeMeterRef.current = createVolumeMeter(stream, (rms) => {
          const now = Date.now();
          if (now - lastVolumeUpdate > 50) {
            setVolume(rms);
            lastVolumeUpdate = now;
          }
          handleVAD(rms);
        });

        startRecording(stream);
        send({ type: "start_listening" });
      } catch {
        setError("Mikrofon erişimi reddedildi");
        setVoiceStarted(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceStarted, micActive]);

  // ─── Mic control ─────────────────────────────────────

  const toggleMic = useCallback(async () => {
    if (micActive) {
      stopRecording();
      stopMicStream();
      setMicActive(false);
      send({ type: "stop_listening" });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });
        mediaStreamRef.current = stream;
        setMicActive(true);
        setError(null);
        setTranscript("");
        aiTextAccRef.current = "";
        setAiText("");

        // Volume meter
        let lastVolumeUpdate = 0;
        volumeMeterRef.current = createVolumeMeter(stream, (rms) => {
          const now = Date.now();
          if (now - lastVolumeUpdate > 50) { // Throttle to 20fps
            setVolume(rms);
            lastVolumeUpdate = now;
          }
          handleVAD(rms);
        });

        startRecording(stream);
        send({ type: "start_listening" });
      } catch {
        setError("Mikrofon erişimi reddedildi");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micActive]);

  // ─── Recording ───────────────────────────────────────

  function startRecording(stream: MediaStream): void {
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = async (e) => {
      if (e.data.size === 0) return;
      const arrayBuffer = await e.data.arrayBuffer();
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer)),
      );
      send({ type: "audio_chunk", data: base64 });
    };

    // Send chunks every 250ms
    recorder.start(250);
  }

  function stopRecording(): void {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    recorderRef.current = null;
  }

  function stopMicStream(): void {
    volumeMeterRef.current?.stop();
    volumeMeterRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setVolume(0);
    clearSilenceTimer();
  }

  // ─── VAD (improved with confidence checking) ─────────

  function handleVAD(rms: number): void {
    const currentState = stateRef.current;
    const isAISpeaking = currentState === "speaking" || currentState === "processing";

    // Use higher thresholds during AI speaking to prevent echo/feedback false triggers
    const threshold = isAISpeaking ? VAD_INTERRUPT_THRESHOLD : VAD_THRESHOLD;
    const minSpeechMs = isAISpeaking ? VAD_INTERRUPT_SPEECH_MS : VAD_MIN_SPEECH_MS;
    const confidenceMs = isAISpeaking ? VAD_INTERRUPT_CONFIDENCE_MS : VAD_SPEECH_CONFIDENCE_MS;

    if (rms > threshold) {
      // Reset consecutive silence counter
      consecutiveSilenceRef.current = 0;

      // Clear silence timer if it exists
      clearSilenceTimer();

      // Check if we need confidence before starting speech detection
      if (!speechConfidenceTimeRef.current) {
        speechConfidenceTimeRef.current = Date.now();
      } else {
        const confidenceDuration = Date.now() - speechConfidenceTimeRef.current;

        // Only start tracking speech after confidence threshold
        if (confidenceDuration >= confidenceMs && !speechStartTimeRef.current) {
          speechStartTimeRef.current = Date.now();
        }
      }

      // VAD Interruption: Only if confident speech is detected
      if (isAISpeaking && speechStartTimeRef.current) {
        const speechDuration = Date.now() - speechStartTimeRef.current;
        if (speechDuration >= minSpeechMs) {
          send({ type: "interrupt" });
          playerRef.current.flush();
          aiTextAccRef.current = "";
          setAiText("");
          // Start recording immediately to capture user's speech
          if (!recorderRef.current && mediaStreamRef.current) {
            startRecording(mediaStreamRef.current);
            send({ type: "start_listening" });
          }
          // Reset tracking after interrupt
          speechStartTimeRef.current = null;
          speechConfidenceTimeRef.current = null;
        }
      }
    } else {
      // Silence detected
      consecutiveSilenceRef.current++;

      // Reset confidence if we have sustained silence (raised from 5 to 15 frames to avoid premature reset)
      if (consecutiveSilenceRef.current > 15) {
        speechConfidenceTimeRef.current = null;
        speechStartTimeRef.current = null;
      }

      // Only start silence timer if we were actually speaking
      if (!silenceTimerRef.current && recorderRef.current && speechStartTimeRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          // Silence exceeded threshold — stop and send
          stopRecording();
          send({ type: "stop_listening" });

          // Reset all speech tracking
          speechStartTimeRef.current = null;
          speechConfidenceTimeRef.current = null;
          consecutiveSilenceRef.current = 0;
        }, VAD_SILENCE_MS);
      }
    }
  }

  function clearSilenceTimer(): void {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  // ─── Auto-restart mic after AI finishes ──────────────

  useEffect(() => {
    // Add a small delay to prevent re-render loops
    const timeoutId = setTimeout(() => {
      if (state === "idle" && micActive && !recorderRef.current) {
        // AI finished speaking, restart recording
        const stream = mediaStreamRef.current;
        if (stream && stream.active) {
          aiTextAccRef.current = "";
          setAiText("");
          setTranscript("");
          startRecording(stream);
          send({ type: "start_listening" });
        }
      }
    }, 10);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, micActive]);

  // ─── Interrupt ───────────────────────────────────────

  const interrupt = useCallback(() => {
    send({ type: "interrupt" });
    playerRef.current.flush();
    aiTextAccRef.current = "";
    setAiText("");
  }, []);

  const sendCodeUpdate = useCallback((code: string, language: CodeLanguage) => {
    send({ type: "code_update", code, language });
  }, []);

  const sendCodeResult = useCallback(
    (results: TestResult[], stdout: string, stderr: string, error?: string) => {
      send({ type: "code_result", results, stdout, stderr, error });
    },
    [],
  );

  const sendWhiteboardUpdate = useCallback((state: WhiteboardState) => {
    send({ type: "whiteboard_update", state });
  }, []);

  const requestHint = useCallback(() => {
    send({ type: "hint_request" });
  }, []);

  const dismissSolution = useCallback(() => {
    setSolutionComparison(null);
  }, []);

  return {
    state,
    micActive,
    volume,
    transcript,
    aiText,
    error,
    connected,
    voiceStarted,
    hintLevel,
    totalHints,
    questionCurrent,
    questionTotal,
    questionStartTime,
    recommendedSeconds,
    timeWarning,
    solutionComparison,
    startVoiceSession,
    toggleMic,
    interrupt,
    sendCodeUpdate,
    sendCodeResult,
    sendWhiteboardUpdate,
    requestHint,
    dismissSolution,
  };
}
