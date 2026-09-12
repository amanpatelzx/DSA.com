import mongoose from 'mongoose';
import User from '../models/User.js';

const BOT_IDENTIFIERS = [
  'bot',
  'stockfish',
  'computer',
  'algo_expert',
  'deep_recursion',
  'matrix_solver',
  'ai_',
  'training',
  'solo'
];

/**
 * Checks whether an opponent is a real human user registered in the system.
 * Returns the real User document if opponent is a real registered person.
 * Returns null if opponent is a Bot, computer, unauthenticated, or self.
 */
export async function findRealOpponent(opponentParam, currentUserId = null) {
  if (!opponentParam) return null;
  const str = String(opponentParam).trim().toLowerCase();

  // If name contains any bot keywords
  if (BOT_IDENTIFIERS.some(b => str.includes(b))) {
    return null;
  }

  let realOpponent = null;
  if (mongoose.Types.ObjectId.isValid(opponentParam) && String(opponentParam).length === 24) {
    realOpponent = await User.findById(opponentParam);
  }

  if (!realOpponent) {
    realOpponent = await User.findOne({
      username: { $regex: new RegExp(`^${str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
  }

  // A player cannot challenge themselves to change rating
  if (realOpponent && currentUserId && realOpponent._id.toString() === currentUserId.toString()) {
    return null;
  }

  return realOpponent;
}
