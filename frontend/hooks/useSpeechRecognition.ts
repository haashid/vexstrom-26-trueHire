import { useState, useRef, useCallback, useEffect } from 'react';
import { Speaker } from '@/types/interview';

export function useSpeechRecognition({
    onUtterance,
}: {
    onUtterance: (text: string, speaker: Speaker, ts: string) => void;
}) {
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const agentRef = useRef(false);

    const [agentOn, setAgentOn] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const [secs, setSecs] = useState(0);
    const [interim, setInterim] = useState('');

    const secsRef = useRef(secs);
    useEffect(() => { secsRef.current = secs; }, [secs]);
    useEffect(() => { agentRef.current = agentOn; }, [agentOn]);

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const toggleAgent = useCallback((currentSpeaker: Speaker) => {
        if (agentOn) {
            recognitionRef.current?.stop();
            setAgentOn(false);
            setIsListening(false);
            setInterim('');
            if (timerRef.current) clearInterval(timerRef.current);
        } else {
            setMicError(null);
            const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SR) {
                setMicError('Speech recognition requires Chrome or Edge.');
                return;
            }
            const r = new SR();
            r.continuous = true;
            r.interimResults = true;
            r.lang = 'en-US';

            r.onstart = () => setIsListening(true);

            r.onresult = (event: any) => {
                let interim_ = '', final_ = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) final_ += t;
                    else interim_ += t;
                }
                setInterim(interim_);
                if (final_.trim()) {
                    setInterim('');
                    onUtterance(final_.trim(), currentSpeaker, fmt(secsRef.current));
                }
            };

            r.onerror = (e: any) => {
                if (e.error === 'no-speech' || e.error === 'audio-capture' || e.error === 'aborted') return;
                console.error("Speech Recognition Error:", e.error);
                if (e.error === 'not-allowed') {
                    setMicError('Mic access denied. Allow microphone and retry.');
                    setAgentOn(false);
                } else if (e.error === 'network') {
                    setMicError('Network error. Check connection.');
                }
            };

            r.onend = () => {
                if (agentRef.current) {
                    try { r.start(); } catch (e) { console.error("Failed to restart recognition", e); }
                } else {
                    setIsListening(false);
                }
            };

            recognitionRef.current = r;
            r.start();
            setAgentOn(true);
            timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
        }
    }, [agentOn, onUtterance]);

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return {
        agentOn,
        isListening,
        micError,
        secs,
        interim,
        fmt,
        toggleAgent
    };
}
