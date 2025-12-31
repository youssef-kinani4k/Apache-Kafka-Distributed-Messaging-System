import { io } from 'socket.io-client';

// Connexion au Backend (localhost:5000 vu depuis le navigateur de l'utilisateur)
const URL = 'http://localhost:5000';
export const socket = io(URL);