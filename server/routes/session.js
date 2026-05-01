import express from 'express';
import SmartAgent from '../agent/SmartAgent.js';

const router = express.Router();
const agent = new SmartAgent();

/**
 * GET /api/session/challenge/:userId/:day
 * Get challenge for specific day
 */
router.get('/challenge/:userId/:day', async (req, res) => {
  try {
    const { userId, day } = req.params;
    
    const result = await agent.getChallenge(userId, day);
    
    res.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error) {
    console.error('[GET /api/session/challenge]', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        data: null,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      data: null,
      error: error.message
    });
  }
});

/**
 * GET /api/session/dashboard/:userId
 * Get dashboard data
 */
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const dashboardData = agent.getDashboard(userId);

    res.json({
      success: true,
      data: dashboardData,
      error: null
    });
  } catch (error) {
    console.error('[GET /api/session/dashboard]', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        data: null,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      data: null,
      error: error.message
    });
  }
});

/**
 * POST /api/session/submit
 * Submit completed challenge response
 */
router.post('/submit', async (req, res) => {
  try {
    const { userId, day, skillId, challenge, userResponse } = req.body;

    if (!userId || !day || !skillId || !challenge || !userResponse) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'userId, day, skillId, challenge, and userResponse are required'
      });
    }

    const result = await agent.submitSession({
      userId,
      day,
      skillId,
      challenge,
      userResponse
    });

    res.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error) {
    console.error('[POST /api/session/submit]', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message
    });
  }
});

export default router;
