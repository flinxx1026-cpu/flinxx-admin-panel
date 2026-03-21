import express from 'express'
import prisma from '../config/database.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyAdminToken)

// GET /api/appeals - Fetch all pending appeals
router.get('/', async (req, res) => {
  try {
    const appeals = await prisma.appeal.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            display_name: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    
    // Format response to match expected UI structure
    const formattedAppeals = appeals.map(appeal => ({
      id: appeal.id,
      userId: appeal.userId,
      name: appeal.user?.display_name || appeal.user?.email || 'Unknown User',
      message: appeal.message,
      date: appeal.created_at,
      status: appeal.status
    }));

    res.json({ success: true, appeals: formattedAppeals })
  } catch (error) {
    console.error('❌ Error fetching appeals:', error)
    res.status(500).json({ success: false, message: 'Server error fetching appeals', error: error.message })
  }
})

// POST /api/appeals/:id/approve - Approve an appeal
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id;
    
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    const appeal = await prisma.appeal.findUnique({
      where: { id }
    });

    if (!appeal) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    // Begin transaction to update both appeal and user
    const [updatedAppeal, updatedUser] = await prisma.$transaction([
      prisma.appeal.update({
        where: { id },
        data: { 
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date()
        }
      }),
      prisma.user.update({
        where: { id: appeal.userId },
        data: {
          is_banned: false,
          ban_reason: null
        }
      })
    ]);

    res.json({ success: true, message: 'Appeal approved and user unbanned', appeal: updatedAppeal });
  } catch (error) {
    console.error('❌ Error approving appeal:', error);
    res.status(500).json({ success: false, message: 'Server error approving appeal', error: error.message });
  }
})

// POST /api/appeals/:id/reject - Reject an appeal
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id;
    
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    const appeal = await prisma.appeal.update({
      where: { id },
      data: { 
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date()
      }
    });

    res.json({ success: true, message: 'Appeal rejected', appeal });
  } catch (error) {
    console.error('❌ Error rejecting appeal:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting appeal', error: error.message });
  }
})

export default router
