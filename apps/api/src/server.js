import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import problemRoutes from './routes/problems.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import battleRoutes from './routes/battles.js';
import judgeRoutes from './routes/judge.js';
import learnRoutes from './routes/learn.js';
import watchRoutes from './routes/watch.js';
import clubRoutes from './routes/clubs.js';
import tournamentRoutes from './routes/tournaments.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/watch', watchRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/tournaments', tournamentRoutes);

import { initSocket } from './socket.js';

// Socket.IO Logic
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

// Connect to DB and start server
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
