import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext) || {};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Intelligently infer socket URL from VITE_SOCKET_URL or VITE_API_URL or localhost
      let socketUrl = import.meta.env.VITE_SOCKET_URL;
      if (!socketUrl) {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl && apiUrl.startsWith('http')) {
          socketUrl = apiUrl.replace(/\/api\/?$/, '');
        } else {
          socketUrl = 'http://localhost:5000';
        }
      }

      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('onlineUsers', (users) => {
        setOnlineUsers(users || []);
      });

      socket.on('connect_error', (err) => {
        // Silently log or retry without breaking UI
        console.warn('Socket connection info:', err.message);
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setOnlineUsers([]);
    }
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
