import { useState, useEffect } from 'react';

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);

  useEffect(() => {
    // In a real app, this would connect to url
    // For now, we'll simulate the state for UI development
    setReadyState(WebSocket.OPEN);
    
    // Cleanup
    return () => {
      setReadyState(WebSocket.CLOSED);
    };
  }, [url]);

  return { lastMessage, readyState };
}
