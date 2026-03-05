import { useEffect, useRef } from 'react';
import { Speaker } from '@/types/interview';

export function useInterviewWebSocket({
    onUtterance,
}: {
    onUtterance: (text: string, speaker: Speaker) => void;
}) {
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return;

            console.log("[Extension Bridge] Connecting to WebSocket...");
            const ws = new WebSocket('ws://localhost:8000/api/v1/ws/transcript');
            wsRef.current = ws;

            ws.onopen = () => console.log("[Extension Bridge] Connected");

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'transcript') {
                        console.log("[Extension Bridge] Received:", data.text);
                        // Convert role to frontend expected 'Panelist' | 'Candidate'
                        const role: Speaker = data.speaker.toLowerCase().includes('candidate') ? 'Candidate' :
                            data.speaker.toLowerCase().includes('you') ? 'Candidate' : 'Panelist';

                        onUtterance(data.text, role);
                    }
                } catch (err) {
                    console.error("[Extension Bridge] Error processing message:", err);
                }
            };

            ws.onclose = () => {
                console.log("[Extension Bridge] Disconnected. Reconnecting in 3s...");
                reconnectTimeout = setTimeout(connect, 3000);
            };

            ws.onerror = (err) => {
                // If it's already closing, don't spam errors
                if (ws.readyState !== WebSocket.CLOSED) {
                    console.error("[Extension Bridge] WebSocket Error:", err);
                }
                ws.close();
            };
        };

        connect();

        return () => {
            if (wsRef.current) {
                // Remove onclose to prevent reconnect loop during cleanup
                wsRef.current.onclose = null;
                wsRef.current.close();
                wsRef.current = null;
            }
            clearTimeout(reconnectTimeout);
        };
    }, [onUtterance]);
}
