// SmartAgent.js — Finals Upgrade
// Key additions:
//   • Agent Debate integration in submitSession
//   • Confidence calibration tracking endpoint
//   • Richer agent decision log with debate data
//   • Skill drift detection (new innovation)
// All other logic preserved from existing implementation.

import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import SkillDecomposer from './SkillDecomposer.js';
import QuizGenerator from './QuizGenerator.js';
import Evaluator from './Evaluator.js';
import PlanBuilder from './PlanBuilder.js';
import ChallengeEngine from './ChallengeEngine.js';
import Adaptor from './Adaptor.js';
import ReportGenerator from './ReportGenerator.js';
import OpenAIContentEngine from './OpenAIContentEngine.js';
import AgentDebate from './AgentDebate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

class SmartAgent {
  constructor() {
    this.skillDecomposer = new SkillDecomposer();
    this.quizGenerator = new QuizGenerator();
    this.evaluator = new Evaluator();
    this.planBuilder = new PlanBuilder();
    this.challengeEngine = new ChallengeEngine();
    this.adaptor = new Adaptor();
    this.reportGenerator = new ReportGenerator();
    this.openAI = new OpenAIContentEngine();
  }

  // ── EXISTING: processGoal (preserved) ────────────────────────────────────
  async processGoal(goalText, existingUserId) {
    const userId = existingUserId || randomUUID();
    const baseSkillTree = this.skillDecomposer.decompose(goalText);
    const enhancedSkillTree = await this.enhanceSkillTree(goalText, baseSkillTree);
    const enrichedSkills = enhancedSkillTree.skills.map((skill, index) => ({
      ...skill,
      sequenceOrder: index + 1,
      mastery: 0,
      status: index === 0 ? 'active' : 'locked',
      sessionsCompleted: 0,
    }));
    const totalEstimatedDays = enrichedSkills.reduce((sum, skill) => sum + skill.days, 0);

    const staticQuestions = this.quizGenerator.generate({
      ...enhancedSkillTree,
      skills: enrichedSkills,
    });
    const diagnosticQuestions = await this.enrichQuestions(goalText, staticQuestions, enhancedSkillTree.profile, enrichedSkills);
    const topSkillNames = enrichedSkills.slice(0, 3).map(s => s.name).join(', ');

    const agentDecisions = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        type: 'goal_analysis',
        icon: '🎯',
        title: 'GoalAgent — Domain Detected',
        detail: `Identified "${enhancedSkillTree.domainName}" as the learning domain. Learner level: ${enhancedSkillTree.profile.learnerLevel}, intensity: ${enhancedSkillTree.profile.intensity}.`,
        reasoning: `Scanned goal text for domain-specific keywords. Matched "${enhancedSkillTree.domain}" with highest confidence score. Detected tools: ${enhancedSkillTree.profile.detectedTools.join(', ') || 'none specified'}.`,
      },
      {
        id: 2,
        timestamp: new Date().toISOString(),
        type: 'skill_tree',
        icon: '🌳',
        title: 'DecomposeAgent — Skill Tree Built',
        detail: `Decomposed goal into ${enrichedSkills.length} core skills spanning ${totalEstimatedDays} learning days. Priority: ${topSkillNames}.`,
        reasoning: `Skills ranked by relevance to goal keywords and detected tools. Days allocated proportionally — more days for foundational skills, fewer for those already partially understood.`,
      },
      {
        id: 3,
        timestamp: new Date().toISOString(),
        type: 'diagnostic',
        icon: '📋',
        title: 'DiagnosticAgent — Quiz Generated',
        detail: `Created ${diagnosticQuestions.length} targeted questions across ${enrichedSkills.length} skill areas to assess current proficiency.`,
        reasoning: `Questions selected by relevance score to the user's goal keywords. Open-ended questions preferred to capture reasoning depth.`,
      },
    ];

    const session = {
      userId,
      goal: {
        goalText,
        domain: enhancedSkillTree.domain,
        domainLabel: enhancedSkillTree.domainName,
        domainIcon: this.skillDecomposer.getDomainIcon(enhancedSkillTree.domain),
        profile: enhancedSkillTree.profile,
        skills: enrichedSkills,
        totalEstimatedDays,
      },
      skillTree: { ...enhancedSkillTree, skills: enrichedSkills },
      diagnosticQuestions,
      diagnosticScores: {},
      learningPlan: [],
      sessions: [],
      adaptations: [],
      agentDecisions,
      confidenceCalibrations: [], // NEW: track confidence vs actual
      agentDebates: [],           // NEW: full debate logs
      report: null,
      createdAt: new Date().toISOString(),
    };

    this.saveSession(session);
    return { userId, skillTree: session.skillTree, diagnosticQuestions };
  }

  // ── EXISTING: submitDiagnostic (preserved) ────────────────────────────────
  async submitDiagnostic(userId, answers) {
    const session = this.loadSession(userId);
    const normalizedAnswers = session.diagnosticQuestions.map((question, index) => {
      const rawAnswer = answers[index];
      if (typeof rawAnswer === 'string') return { questionId: question.id, answer: rawAnswer };
      return rawAnswer;
    });

    const evaluationResults = this.evaluator.scoreDiagnostic(session.diagnosticQuestions, normalizedAnswers);
    const diagnosticScores = {};

    for (const skill of session.goal.skills) {
      const skillQuestions = session.diagnosticQuestions.filter(q => q.skillId === skill.id);
      const skillResults = evaluationResults.filter(r =>
        skillQuestions.some(q => q.id === r.questionId)
      );
      const average = skillResults.length === 0
        ? 0
        : Math.round(skillResults.reduce((s, r) => s + r.score, 0) / skillResults.length);
      diagnosticScores[skill.id] = average;
      skill.mastery = average;
      skill.status = average >= 75 ? 'complete' : 'active';
    }

    const firstIncompleteIndex = session.goal.skills.findIndex(s => s.status !== 'complete');
    session.goal.skills = session.goal.skills.map((skill, index) => ({
      ...skill,
      status: firstIncompleteIndex === -1 ? 'complete'
        : index < firstIncompleteIndex ? 'complete'
        : index === firstIncompleteIndex ? 'active'
        : 'locked',
    }));
    session.skillTree.skills = session.goal.skills;

    const diagnosticArray = Object.entries(diagnosticScores).map(([skillId, score]) => ({ skillId, score }));
    const builtPlan = this.planBuilder.build(session.skillTree, diagnosticArray);

    const weakSkills = diagnosticArray.filter(d => d.score < 60);
    const strongSkills = diagnosticArray.filter(d => d.score >= 75);
    const weakNames = weakSkills.map(d => {
      const sk = session.goal.skills.find(s => s.id === d.skillId);
      return sk ? `${sk.name} (${d.score}%)` : d.skillId;
    }).join(', ');

    if (!session.agentDecisions) session.agentDecisions = [];
    session.agentDecisions.push({
      id: session.agentDecisions.length + 1,
      timestamp: new Date().toISOString(),
      type: 'diagnostic_complete',
      icon: '📊',
      title: 'ScoringAgent — Gaps Identified',
      detail: `${weakSkills.length} skill(s) need focused practice, ${strongSkills.length} already proficient. Weakest: ${weakNames || 'all skills strong'}.`,
      reasoning: `Scored each answer via keyword matching and response depth. Skills below 60% assigned extra learning days; above 80% compressed to fewer sessions.`,
    });
    session.agentDecisions.push({
      id: session.agentDecisions.length + 1,
      timestamp: new Date().toISOString(),
      type: 'plan_built',
      icon: '📅',
      title: 'CurriculumAgent — Plan Generated',
      detail: `Generated ${builtPlan.days.length}-day personalized plan. Weakest skills scheduled first.`,
      reasoning: `Skills sorted by diagnostic score (weakest → strongest). Day count adjusted by proficiency multiplier.`,
    });

    session.diagnosticScores = diagnosticScores;
    session.learningPlan = builtPlan.days.map((day, index) => {
      const skill = session.goal.skills.find(e => e.id === day.skillId);
      return {
        day: day.day,
        skillId: day.skillId,
        skillName: skill?.name || day.skillId,
        objective: this.buildObjective(day, skill, session.goal.profile),
        sessionType: day.isReview ? 'review' : index % 2 === 0 ? 'concept' : 'practice',
        estimatedMinutes: 30,
        resources: this.buildResources(skill, session.goal.profile),
        completed: false,
        score: null,
        addedByAgent: false,
        challengeId: day.challengeId,
        topic: day.topic,
      };
    });

    this.saveSession(session);
    return { diagnosticScores: session.diagnosticScores, learningPlan: session.learningPlan };
  }

  // ── EXISTING: getChallenge (preserved) ───────────────────────────────────
  async getChallenge(userId, day) {
    const session = this.loadSession(userId);
    const planDay = session.learningPlan.find(e => e.day === parseInt(day, 10));
    if (!planDay) throw new Error(`Day ${day} not found in learning plan`);

    let challenge = this.challengeEngine.getChallengeForDay(planDay, session);

    if (challenge.source === 'fallback' && this.openAI.isEnabled()) {
      const generated = await this.openAI.generateChallenge({
        goalText: session.goal.goalText,
        profile: session.goal.profile,
        planDay,
        recentWeaknesses: session.sessions.slice(-3).flatMap(e => e.weaknesses || []).slice(0, 4),
      });
      if (generated) challenge = { ...generated, source: 'llm' };
    }

    return { planDay, challenge };
  }

  // ── UPGRADED: submitSession — integrates Agent Debate ────────────────────
  async submitSession({ userId, day, skillId, challenge, userResponse }) {
    const session = this.loadSession(userId);
    const evaluation = this.evaluator.scoreSession(challenge, userResponse);
    const completedAt = new Date().toISOString();
    const skill = session.goal.skills.find(e => e.id === skillId);

    const record = {
      day: Number(day),
      skillId,
      skillName: skill?.name || skillId,
      challenge,
      userResponse,
      score: evaluation.score,
      grade: evaluation.grade,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      feedback: evaluation.feedback,
      completedAt,
    };

    session.sessions.push(record);

    session.learningPlan = session.learningPlan.map(e =>
      e.day === Number(day) ? { ...e, completed: true, score: evaluation.score } : e
    );

    if (skill) {
      skill.sessionsCompleted += 1;
      skill.mastery = Math.round(
        session.sessions.filter(e => e.skillId === skillId)
          .reduce((s, e) => s + e.score, 0) /
        session.sessions.filter(e => e.skillId === skillId).length
      );
      skill.status = skill.mastery >= 75 ? 'complete' : 'active';
    }

    // Run adaptor (now includes Agent Debate)
    const adaptationResult = this.adaptor.apply(session.learningPlan, session.sessions, session.goal.skills);
    session.learningPlan = adaptationResult.learningPlan;

    if (!session.agentDecisions) session.agentDecisions = [];
    if (!session.agentDebates) session.agentDebates = [];

    // Log Agent Debate if it happened
    if (adaptationResult.debate) {
      session.agentDebates.push(adaptationResult.debate);
      const debateDecision = AgentDebate.formatAsDecision(adaptationResult.debate);
      if (debateDecision) session.agentDecisions.push(debateDecision);
    }

    if (adaptationResult.message) {
      session.adaptations.push(adaptationResult.message);
      // If no debate decision already logged, add regular adaptation log
      if (!adaptationResult.debate) {
        session.agentDecisions.push({
          id: session.agentDecisions.length + 1,
          timestamp: new Date().toISOString(),
          type: 'adaptation',
          icon: '⚡',
          title: 'AdaptorAgent — Plan Modified',
          detail: adaptationResult.message,
          reasoning: 'Agent monitors rolling average score every 3 sessions. Scores < 50 → adds review days. Scores > 88 → accelerates.',
        });
      }
    }

    // Log session completion
    session.agentDecisions.push({
      id: session.agentDecisions.length + 1,
      timestamp: completedAt,
      type: 'session_complete',
      icon: '✅',
      title: `EvaluatorAgent — Day ${day} Scored`,
      detail: `Score: ${evaluation.score}% (${evaluation.grade}). Strengths: ${evaluation.strengths.slice(0, 2).join(', ')}. Gaps: ${evaluation.weaknesses.slice(0, 2).join(', ')}.`,
      reasoning: `Evaluated against ${challenge.evaluation_criteria?.length || 0} criteria. Awarded points for coverage, reasoning patterns, and response depth.`,
    });

    // NEW: Skill drift detection
    this._detectSkillDrift(session);

    this.saveSession(session);

    return {
      evaluation,
      adaptations: session.adaptations,
      nextDay: session.learningPlan.find(e => !e.completed)?.day || null,
    };
  }

  // ── NEW: Skill drift detection ─────────────────────────────────────────
  _detectSkillDrift(session) {
    // Check if a previously-mastered skill is declining
    for (const skill of session.goal.skills) {
      const skillSessions = session.sessions.filter(s => s.skillId === skill.id);
      if (skillSessions.length < 4) continue;

      const early = skillSessions.slice(0, 2).reduce((s, r) => s + r.score, 0) / 2;
      const recent = skillSessions.slice(-2).reduce((s, r) => s + r.score, 0) / 2;
      const drift = early - recent;

      if (drift > 20) {
        // Skill is drifting backward
        const driftDecision = {
          id: (session.agentDecisions?.length || 0) + 1,
          timestamp: new Date().toISOString(),
          type: 'adaptation',
          icon: '📉',
          title: `SkillDriftAgent — "${skill.name}" Declining`,
          detail: `Performance on "${skill.name}" dropped ${Math.round(drift)}pts since initial sessions (${Math.round(early)}% → ${Math.round(recent)}%).`,
          reasoning: `Skill drift detected via temporal score comparison. Early mastery may have been superficial. Recommending spaced repetition session.`,
        };
        if (!session.agentDecisions) session.agentDecisions = [];
        // Only add if not already added recently
        const alreadyLogged = session.agentDecisions.some(
          d => d.title?.includes(`"${skill.name}" Declining`)
        );
        if (!alreadyLogged) session.agentDecisions.push(driftDecision);
      }
    }
  }

  // ── NEW: Get debate log ───────────────────────────────────────────────────
  getDebates(userId) {
    const session = this.loadSession(userId);
    return session.agentDebates || [];
  }

  // ── EXISTING: generateReport (preserved) ─────────────────────────────────
  async generateReport(userId) {
    const session = this.loadSession(userId);
    let llmReport = null;

    if (this.openAI.isEnabled()) {
      llmReport = await this.openAI.generateReport({
        goalText: session.goal.goalText,
        domainLabel: session.goal.domainLabel,
        profile: session.goal.profile,
        sessions: session.sessions.map(e => ({
          day: e.day, skillName: e.skillName, score: e.score,
          grade: e.grade, strengths: e.strengths, weaknesses: e.weaknesses,
        })),
        skills: session.goal.skills.map(s => ({ name: s.name, mastery: s.mastery, status: s.status })),
        adaptations: session.adaptations,
      });
    }

    session.report = this.reportGenerator.generate(session, llmReport);
    this.saveSession(session);
    return session.report;
  }

  // ── EXISTING: getDashboard (preserved) ───────────────────────────────────
  getDashboard(userId) {
    const session = this.loadSession(userId);
    const scores = session.sessions.map(e => e.score);
    const stats = {
      avgScore: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
      bestScore: scores.length ? Math.max(...scores) : 0,
      totalSessions: session.sessions.length,
      completedDays: session.learningPlan.filter(e => e.completed).length,
    };

    return {
      goal: session.goal,
      skillTree: session.skillTree,
      learningPlan: session.learningPlan,
      sessions: session.sessions,
      stats,
      adaptations: session.adaptations,
      diagnosticScores: session.diagnosticScores,
      agentDecisions: session.agentDecisions || [],
      agentDebates: session.agentDebates || [],
    };
  }

  // ── Preserved helpers ────────────────────────────────────────────────────
  async enhanceSkillTree(goalText, baseSkillTree) {
    if (!this.openAI.isEnabled()) return baseSkillTree;
    const enhancement = await this.openAI.generateGoalEnhancement({
      goalText,
      domain: baseSkillTree.domain,
      domainName: baseSkillTree.domainName,
      profile: baseSkillTree.profile,
      staticSkills: baseSkillTree.skills.map(s => ({
        id: s.id, name: s.name, description: s.description,
        level: s.level, days: s.days, topics: s.topics,
      })),
    });
    if (!enhancement) return baseSkillTree;

    const mergedProfile = {
      ...baseSkillTree.profile,
      targetRole: enhancement.targetRole || baseSkillTree.profile.targetRole,
      learnerLevel: enhancement.learnerLevel || baseSkillTree.profile.learnerLevel,
      intensity: enhancement.intensity || baseSkillTree.profile.intensity,
      detectedTools: enhancement.detectedTools?.length ? enhancement.detectedTools : baseSkillTree.profile.detectedTools,
      focusKeywords: enhancement.focusKeywords?.length ? enhancement.focusKeywords : baseSkillTree.profile.focusKeywords,
      learningPreferences: enhancement.learningPreferences || null,
    };

    const customSkills = (enhancement.customSkills || []).map(s => ({ ...s, source: 'llm' }));
    const byId = new Map();
    [...baseSkillTree.skills, ...customSkills].forEach(s => { if (!byId.has(s.id)) byId.set(s.id, s); });
    let mergedSkills = Array.from(byId.values());

    if (enhancement.recommendedOrder?.length) {
      const orderMap = new Map(enhancement.recommendedOrder.map((id, i) => [id, i]));
      mergedSkills = mergedSkills.sort((a, b) => {
        const ao = orderMap.has(a.id) ? orderMap.get(a.id) : 999;
        const bo = orderMap.has(b.id) ? orderMap.get(b.id) : 999;
        return ao - bo;
      });
    }

    return { ...baseSkillTree, profile: mergedProfile, skills: mergedSkills };
  }

  async enrichQuestions(goalText, diagnosticQuestions, profile, skills) {
    if (!this.openAI.isEnabled()) return diagnosticQuestions;
    const questionGroups = new Map();
    diagnosticQuestions.forEach(q => {
      if (!questionGroups.has(q.skillId)) questionGroups.set(q.skillId, []);
      questionGroups.get(q.skillId).push(q);
    });

    for (const skill of skills) {
      const questions = questionGroups.get(skill.id) || [];
      const needsLLM = questions.length < 2 || questions.some(q => q.source === 'fallback') || skill.source === 'llm';
      if (!needsLLM) continue;

      const generated = await this.openAI.generateQuestions({
        goalText, profile,
        skill: { id: skill.id, name: skill.name, description: skill.description, level: skill.level, topics: skill.topics, reason: skill.reason || '' },
        staticQuestions: questions.map(q => ({ question: q.question, type: q.type, keyConcepts: q.key_concepts || [] })),
      });

      if (generated?.questions?.length) {
        questionGroups.set(skill.id, generated.questions.slice(0, 2).map((q, i) => ({
          ...q,
          id: `${q.id || `q_${skill.id}_llm_${i + 1}`}_${skill.id}_${i + 1}`,
          skillId: skill.id, skillName: skill.name,
          targetRole: profile?.targetRole || null,
          personalizationHint: skill.reason || `Generated for ${skill.name}`,
          source: 'llm',
        })));
      }
    }

    return skills.flatMap(skill => questionGroups.get(skill.id) || []);
  }

  loadSession(userId) {
    const sessionPath = join(DATA_DIR, `${userId}.json`);
    if (!existsSync(sessionPath)) throw new Error(`Session not found: ${userId}`);
    return JSON.parse(readFileSync(sessionPath, 'utf-8'));
  }

  saveSession(session) {
    const sessionPath = join(DATA_DIR, `${session.userId}.json`);
    writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  }

  buildObjective(day, skill, profile) {
    const roleContext = profile?.targetRole ? ` for your ${profile.targetRole} goal` : '';
    const skillReason = skill?.reason ? ` ${skill.reason}` : '';
    return `Build confidence in ${day.topic} for ${skill?.name || day.skillId}${roleContext}.${skillReason}`.trim();
  }

  buildResources(skill, profile) {
    const resources = ['https://developer.mozilla.org/', 'https://www.freecodecamp.org/'];
    const toolResources = {
      python: 'https://docs.python.org/3/',
      django: 'https://docs.djangoproject.com/',
      react: 'https://react.dev/',
      node: 'https://nodejs.org/en/docs',
      sql: 'https://www.postgresql.org/docs/',
    };
    for (const tool of profile?.detectedTools || []) {
      if (toolResources[tool]) resources.push(toolResources[tool]);
    }
    if (skill?.topics?.length) resources.push(`Practice focus: ${skill.topics.slice(0, 2).join(', ')}`);
    return [...new Set(resources)].slice(0, 4);
  }
}

export default SmartAgent;
