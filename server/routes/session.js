import express from 'express';
import SmartAgent from '../agent/SmartAgent.js';

const router = express.Router();
const agent = new SmartAgent();

router.get('/challenge/:userId/:day', async (req, res) => {
  try {
    const { userId, day } = req.params;
    const result = await agent.getChallenge(userId, day);
    res.json({ success: true, data: result, error: null });
  } catch (error) {
    console.error('[GET /api/session/challenge]', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, data: null, error: error.message });
  }
});

router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = agent.getDashboard(userId);
    res.json({ success: true, data, error: null });
  } catch (error) {
    console.error('[GET /api/session/dashboard]', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, data: null, error: error.message });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { userId, day, skillId, challenge, userResponse } = req.body;
    if (!userId || !day || !skillId || !challenge || !userResponse) {
      return res.status(400).json({
        success: false, data: null,
        error: 'userId, day, skillId, challenge, and userResponse are required',
      });
    }
    const result = await agent.submitSession({ userId, day, skillId, challenge, userResponse });
    res.json({ success: true, data: result, error: null });
  } catch (error) {
    console.error('[POST /api/session/submit]', error);
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// NEW: Agent debates endpoint
router.get('/debates/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const debates = agent.getDebates(userId);
    res.json({ success: true, data: { debates }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
});

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      agents: ['GoalAgent', 'DecomposeAgent', 'DiagnosticAgent', 'ScoringAgent', 'CurriculumAgent', 'EvaluatorAgent', 'AdaptorAgent', 'SkillDriftAgent'],
      innovations: ['SkillDigitalTwin', 'PredictiveMasteryForecast', 'AgentDebate', 'ConfidenceCalibration', 'SkillDriftDetection'],
    },
    error: null,
  });
});

export default router;
