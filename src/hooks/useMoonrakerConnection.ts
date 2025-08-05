import { useState, useEffect, useCallback } from 'react';
import { MoonrakerWebSocket } from '../lib/moonraker-websocket';
import { MoonrakerAPI } from '../lib/moonraker-api';

interface PrinterStatus {
  state: string;
  isHomed: boolean;
  position: { x: number; y: number; z: number };
  connected: boolean;
}

interface UseMoonrakerConnectionReturn {
  status: PrinterStatus;
  websocket: MoonrakerWebSocket | null;
  connect: (host?: string, port?: string) => Promise<void>;
  disconnect: () => void;
  sendHome: () => Promise<void>;
  sendMove: (x: number, y: number, z?: number) => Promise<void>;
  isConnected: boolean;
  error: string | null;
  setServer: (host: string, port?: string) => void;
  currentServer: { host: string; port: string };
}

export const useMoonrakerConnection = (): UseMoonrakerConnectionReturn => {
  const [websocket, setWebsocket] = useState<MoonrakerWebSocket | null>(null);
  const [status, setStatus] = useState<PrinterStatus>({
    state: 'unknown',
    isHomed: false,
    position: { x: 0, y: 0, z: 0 },
    connected: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [currentServer, setCurrentServer] = useState<{ host: string; port: string }>({
    host: 'localhost',
    port: '7125'
  });

  const connect = useCallback(async (host?: string, port?: string) => {
    try {
      setError(null);
      const ws = new MoonrakerWebSocket(host, port);
      
      await ws.connect();
      setWebsocket(ws);
      
      // Set up status monitoring
      ws.onPrinterStateChange((data) => {
        setStatus(prev => ({
          ...prev,
          state: data.print_stats?.state || prev.state,
          connected: true,
        }));
      });

      ws.onPositionUpdate((data) => {
        if (data.toolhead?.position) {
          const [x, y, z] = data.toolhead.position;
          setStatus(prev => ({
            ...prev,
            position: { x, y, z },
            isHomed: data.toolhead?.homed_axes?.includes('x') && 
                     data.toolhead?.homed_axes?.includes('y'),
          }));
        }
      });

      // Update API to use same server
      if (host && port) {
        MoonrakerAPI.setServer(host, port);
      }

      // Get initial status
      const printerStatus = await MoonrakerAPI.getPrinterStatus();
      const currentPos = await MoonrakerAPI.getCurrentPosition();
      const isHomed = await MoonrakerAPI.isHomed();

      setStatus(prev => ({
        ...prev,
        state: printerStatus.state,
        position: currentPos,
        isHomed,
        connected: true,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      console.error('Failed to connect to Moonraker:', err);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (websocket) {
      websocket.disconnect();
      setWebsocket(null);
    }
    setStatus(prev => ({ ...prev, connected: false }));
  }, [websocket]);

  const sendHome = useCallback(async () => {
    try {
      setError(null);
      await MoonrakerAPI.homeSystem();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Homing failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const sendMove = useCallback(async (x: number, y: number, z?: number) => {
    try {
      setError(null);
      await MoonrakerAPI.moveToPosition(x, y, z);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Move failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const setServer = useCallback((host: string, port: string = '7125') => {
    // Update API server
    MoonrakerAPI.setServer(host, port);
    
    // Update local state
    setCurrentServer({ host, port });
    
    // Update WebSocket server
    if (websocket) {
      websocket.setServer(host, port);
    }
  }, [websocket]);

  useEffect(() => {
    // Auto-connect on mount with default settings
    connect().catch(error => {
      console.warn('Initial connection failed:', error);
    });

    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    websocket,
    connect,
    disconnect,
    sendHome,
    sendMove,
    setServer,
    isConnected: websocket?.isConnected() || false,
    error,
    currentServer,
  };
};