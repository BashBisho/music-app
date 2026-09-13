import { useEffect, useRef, useState, useCallback } from 'react';
import TcpSocket from 'react-native-tcp-socket';

const GATEWAY_IP = '192.168.43.1'; // Static IP of the phone hosting the hotspot
const SYNC_PORT = 8080;

export function useCarSync({ mode, onTrackReceived, onCommandReceived }) {
  const [isConnected, setIsConnected] = useState(false);
  const activeSockets = useRef([]); // Stores client sockets if in TRANSMITTER mode
  const clientSocketRef = useRef(null); // Stores outgoing connection if in RECEIVER mode
  const serverRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    if (mode === 'TRANSMITTER') {
      // Server role (Phone hosting hotspot)
      const server = TcpSocket.createServer((socket) => {
        activeSockets.current.push(socket);
        setIsConnected(true);

        socket.on('data', (data) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'COMMAND' && onCommandReceived) {
              onCommandReceived(parsed.payload);
            }
          } catch (e) {
            console.warn('Malformed JSON received:', e);
          }
        });

        socket.on('close', () => {
          activeSockets.current = activeSockets.current.filter((s) => s !== socket);
          if (activeSockets.current.length === 0) setIsConnected(false);
        });

        socket.on('error', (err) => console.log('Server socket error:', err));
      });

      server.listen({ port: SYNC_PORT, host: '0.0.0.0' });
      serverRef.current = server;

      return () => {
        isMounted = false;
        activeSockets.current.forEach((s) => s.destroy());
        activeSockets.current = [];
        server.close();
      };
    } 

    if (mode === 'RECEIVER') {
      // Client role (Car tablet connected to hotspot)
      const connect = () => {
        if (!isMounted) return;

        const client = TcpSocket.createConnection(
          { port: SYNC_PORT, host: GATEWAY_IP },
          () => {
            setIsConnected(true);
            console.log('Connected to phone gateway');
          }
        );

        client.on('data', (data) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'TRACK_UPDATE' && onTrackReceived) {
              onTrackReceived(parsed.payload);
            }
          } catch (e) {
            console.warn('Malformed JSON received:', e);
          }
        });

        client.on('close', () => {
          setIsConnected(false);
          clientSocketRef.current = null;
          // Auto-reconnect every 3s if disconnected
          if (isMounted) setTimeout(connect, 3000);
        });

        client.on('error', () => {
          client.destroy();
        });

        clientSocketRef.current = client;
      };

      connect();

      return () => {
        isMounted = false;
        if (clientSocketRef.current) clientSocketRef.current.destroy();
      };
    }
  }, [mode]);

  // Send song metadata (used by TRANSMITTER)
  const sendTrackUpdate = useCallback((trackData) => {
    if (mode !== 'TRANSMITTER') return;
    const message = JSON.stringify({ type: 'TRACK_UPDATE', payload: trackData }) + '\n';
    activeSockets.current.forEach((socket) => socket.write(message));
  }, [mode]);

  // Send controls like play/pause/skip (used by RECEIVER)
  const sendCommand = useCallback((command) => {
    if (mode !== 'RECEIVER' || !clientSocketRef.current) return;
    const message = JSON.stringify({ type: 'COMMAND', payload: command }) + '\n';
    clientSocketRef.current.write(message);
  }, [mode]);

  return { isConnected, sendTrackUpdate, sendCommand };
}