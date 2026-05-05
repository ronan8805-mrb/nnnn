import { io } from 'socket.io-client';
import { API_URL } from './config';

// Socket.IO connection uses the same URL as the API
export const socket = io(API_URL, {
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
});

export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
