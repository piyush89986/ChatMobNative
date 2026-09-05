import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, serverUrl } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !user._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
      return;
    }

    const host = serverUrl.replace(/\/$/, '');
    console.log('[Socket] Connecting to:', host);

    const newSocket = io(host, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected with ID:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join', user._id);
    });

    newSocket.on('getOnlineUsers', (usersList) => {
      if (Array.isArray(usersList)) {
        setOnlineUsers(new Set(usersList));
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.log('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user?._id, serverUrl]);

  const joinChatRoom = useCallback((chatId) => {
    if (socketRef.current && chatId) {
      socketRef.current.emit('chatroom', chatId);
    }
  }, []);

  const sendTyping = useCallback(
    (chatId) => {
      if (socketRef.current && user && chatId) {
        socketRef.current.emit('typing', {
          chatId,
          userId: user._id,
          userName: user.user_name,
        });
      }
    },
    [user]
  );

  const stopTyping = useCallback(
    (chatId) => {
      if (socketRef.current && user && chatId) {
        socketRef.current.emit('stopTyping', {
          chatId,
          userId: user._id,
        });
      }
    },
    [user]
  );

  const markDelivered = useCallback(
    (messageId, chatId) => {
      if (socketRef.current && user && messageId) {
        socketRef.current.emit('messageDelivered', {
          messageId,
          userId: user._id,
          chatId,
        });
      }
    },
    [user]
  );

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUsers.has(userId.toString());
    },
    [onlineUsers]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        joinChatRoom,
        sendTyping,
        stopTyping,
        markDelivered,
        isUserOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
