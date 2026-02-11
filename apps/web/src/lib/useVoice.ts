import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage, VoicePipelineState, Problem, DesignProblem, CodeLanguage, TestResult, WhiteboardState } from "@ffh/types";
import { AudioQueuePlayer, decodePCM16, createVolumeMeter } from "./audio";

interface UseVoiceOptions {
  interviewId?: string;
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
  hintLevel: number;
  totalHints: number;
  questionCurrent: number;
  questionTotal: number;
  questionStartTime: number;
  recommendedSeconds: number;
  timeWarning: number | null;
  solutionComparison: SolutionComparison | null;
  toggleMic: () => void;
  interrupt: () => void;
  sendCodeUpdate: (code: string, language: CodeLanguage) => void;
  sendCodeResult: (results: TestResult[], stdout: string, stderr: string, error?: string) => void;
  sendWhiteboardUpdate: (state: WhiteboardState) => void;
  requestHint: () => void;
  dismissSolution: () => void;
}

function buildWsUrl(interviewId?: string): string {
  // Development için doğrudan API portuna bağlan
  const base = `ws://localhost:3001/ws/voice`;
  return interviewId ? `${base}?interviewId=${interviewId}` : base;
}

// VAD: silence threshold and duration
const VAD_THRESHOLD = 0.01;
const VAD_SILENCE_MS = 800;

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const [state, setState] = useState<VoicePipelineState>("idle");
  const [micActive, setMicActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
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
  const aiTextAccRef = useRef("");
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const unmountedRef = useRef(false);

  // ─── WebSocket (with auto-reconnect) ─────────────────

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const wsUrl = buildWsUrl(options.interviewId);
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
  }, [options.interviewId]);

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
          // Keep accumulated text visible
          setAiText(aiTextAccRef.current); // Final update
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

  // ─── VAD (simple RMS threshold) ──────────────────────

  function handleVAD(rms: number): void {
    if (rms > VAD_THRESHOLD) {
      // Voice detected — clear silence timer
      clearSilenceTimer();
    } else {
      // Silence — start timer if not already running
      if (!silenceTimerRef.current && recorderRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          // Silence exceeded threshold — stop and send
          stopRecording();
          send({ type: "stop_listening" });

          // Wait for AI to finish, then re-enable recording
          // Recording restarts when state goes back to idle
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
    hintLevel,
    totalHints,
    questionCurrent,
    questionTotal,
    questionStartTime,
    recommendedSeconds,
    timeWarning,
    solutionComparison,
    toggleMic,
    interrupt,
    sendCodeUpdate,
    sendCodeResult,
    sendWhiteboardUpdate,
    requestHint,
    dismissSolution,
  };
}
