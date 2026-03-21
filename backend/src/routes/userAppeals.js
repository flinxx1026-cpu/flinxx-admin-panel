import express from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

const router = express.Router()

// POST /api/appeals - Submit an appeal (for banned users)
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing token' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    // Verify user exists and is banned
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, is_banned: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.is_banned !== true) {
      return res.status(400).json({ success: false, message: 'Only banned users can submit an appeal' });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Appeal message is required' });
    }

    const charCount = message.trim().length;
    if (charCount < 30) {
      return res.status(400).json({ success: false, message: 'Appeal message must be at least 30 characters' });
    }
    if (charCount > 1000) {
      return res.status(400).json({ success: false, message: 'Appeal message cannot exceed 1000 characters' });
    }

    // Verify single active appeal per user
    const existingAppeal = await prisma.appeal.findFirst({
      where: {
        userId: userId,
        status: 'pending'
      }
    });

    if (existingAppeal) {
      return res.status(400).json({ success: false, message: 'You already have a pending appeal' });
    }

    // Create the appeal
    const newAppeal = await prisma.appeal.create({
      data: {
        userId: userId,
        message: message.trim(),
        status: 'pending'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Appeal submitted successfully',
      appeal: newAppeal
    });

  } catch (error) {
    console.error('❌ Error submitting appeal:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting appeal' });
  }
});

export default router;
