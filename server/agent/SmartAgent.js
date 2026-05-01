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

  async processGoal(goalText, existingUserId) {
    const userId = existingUserId || randomUUID();
    const baseSkillTree = this.skillDecomposer.decompose(goalText);
    const enhancedSkillTree = await this.enhanceSkillTree(goalText, baseSkillTree);
    const enrichedSkills = enhancedSkillTree.skills.map((skill, index) => ({
      ...skill,
      sequenceOrder: index + 1,
      mastery: 0,
      status: index === 0 ? 'active' : 'locked',
      sessionsCompleted: 0
    }));
    const totalEstimatedDays = enrichedSkills.reduce((sum, skill) => sum + skill.days, 0);

    const staticQuestions = this.quizGenerator.generate({
      ...enhancedSkillTree,
      skills: enrichedSkills
    });
    const diagnosticQuestions = await this.enrichQuestions(goalText, staticQuestions, enhancedSkillTree.profile, enrichedSkills);

    const topSkillNames = enrichedSkills.slice(0, 3).map((s) => s.name).join(', ');
    const agentDecisions = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        type: 'goal_analysis',
        icon: '🎯',
        title: 'Goal Analyzed — Domain Detected',
        detail: `Identified "${enhancedSkillTree.domainName}" as the learning domain. Learner level: ${enhancedSkillTree.profile.learnerLevel}, intensity: ${enhancedSkillTree.profile.intensity}.`,
        reasoning: `Scanned goal text for domain-specific keywords. Matched "${enhancedSkillTree.domain}" with highest confidence score. Detected tools: ${enhancedSkillTree.profile.detectedTools.join(', ') || 'none specified'}.`
      },
      {
        id: 2,
        timestamp: new Date().toISOString(),
        type: 'skill_tree',
        icon: '🌳',
        title: 'Skill Tree Constructed',
        detail: `Decomposed goal into ${enrichedSkills.length} core skills spanning ${totalEstimatedDays} learning days. Top priority: ${topSkillNames}.`,
        reasoning: `Skills ranked by relevance to goal keywords and detected tools. Days allocated proportionally — more days for foundational, less for advanced skills already understood.`
      },
      {
        id: 3,
        timestamp: new Date().toISOString(),
        type: 'diagnostic',
        icon: '📋',
        title: 'Diagnostic Quiz Generated',
        detail: `Created ${diagnosticQuestions.length} targeted questions across ${enrichedSkills.length} skill areas to assess current proficiency.`,
        reasoning: `Questions selected by relevance score to the user's goal keywords. Open-ended questions preferred to capture depth of understanding, not just recall.`
      }
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
        totalEstimatedDays
      },
      skillTree: {
        ...enhancedSkillTree,
        skills: enrichedSkills
      },
      diagnosticQuestions,
      diagnosticScores: {},
      learningPlan: [],
      sessions: [],
      adaptations: [],
      agentDecisions,
      report: null,
      createdAt: new Date().toISOString()
    };

    this.saveSession(session);

    return {
      userId,
      skillTree: session.skillTree,
      diagnosticQuestions
    };
  }

  async submitDiagnostic(userId, answers) {
    const session = this.loadSession(userId);
    const normalizedAnswers = session.diagnosticQuestions.map((question, index) => {
      const rawAnswer = answers[index];
      if (typeof rawAnswer === 'string') {
        return { questionId: question.id, answer: rawAnswer };
      }
      return rawAnswer;
    });

    const evaluationResults = this.evaluator.scoreDiagnostic(session.diagnosticQuestions, normalizedAnswers);
    const diagnosticScores = {};

    for (const skill of session.goal.skills) {
      const skillQuestions = session.diagnosticQuestions.filter((question) => question.skillId === skill.id);
      const skillResults = evaluationResults.filter((result) =>
        skillQuestions.some((question) => question.id === result.questionId)
      );
      const average = skillResults.length === 0
        ? 0
        : Math.round(skillResults.reduce((sum, result) => sum + result.score, 0) / skillResults.length);
      diagnosticScores[skill.id] = average;
      skill.mastery = average;
      skill.status = average >= 75 ? 'complete' : 'active';
    }

    const firstIncompleteIndex = session.goal.skills.findIndex((skill) => skill.status !== 'complete');
    session.goal.skills = session.goal.skills.map((skill, index) => ({
      ...skill,
      status:
        firstIncompleteIndex === -1
          ? 'complete'
          : index < firstIncompleteIndex
            ? 'complete'
            : index === firstIncompleteIndex
              ? 'active'
              : 'locked'
    }));
    session.skillTree.skills = session.goal.skills;

    const diagnosticArray = Object.entries(diagnosticScores).map(([skillId, score]) => ({ skillId, score }));
    const builtPlan = this.planBuilder.build(session.skillTree, diagnosticArray);

    const weakSkills = diagnosticArray.filter((d) => d.score < 60);
    const strongSkills = diagnosticArray.filter((d) => d.score >= 75);
    const weakNames = weakSkills.map((d) => {
      const sk = session.goal.skills.find((s) => s.id === d.skillId);
      return sk ? `${sk.name} (${d.score}%)` : d.skillId;
    }).join(', ');

    if (!session.agentDecisions) session.agentDecisions = [];
    session.agentDecisions.push({
      id: session.agentDecisions.length + 1,
      timestamp: new Date().toISOString(),
      type: 'diagnostic_complete',
      icon: '📊',
      title: 'Diagnostic Scored — Gaps Identified',
      detail: `${weakSkills.length} skill(s) need focused practice, ${strongSkills.length} already proficient. Weakest: ${weakNames || 'all skills strong'}.`,
      reasoning: `Scored each answer via keyword matching and response depth. Skills below 60% assigned extra learning days; above 80% compressed to fewer sessions.`
    });
    session.agentDecisions.push({
      id: session.agentDecisions.length + 1,
      timestamp: new Date().toISOString(),
      type: 'plan_built',
      icon: '📅',
      title: 'Personalized Learning Plan Built',
      detail: `Generated ${builtPlan.days.length}-day plan. Weakest skills scheduled first to build strong foundations early.`,
      reasoning: `Skills sorted by diagnostic score ascending (weakest → strongest). Day count adjusted by proficiency multiplier: low score → more days, high score → fewer days.`
    });

    session.diagnosticScores = diagnosticScores;
    session.learningPlan = builtPlan.days.map((day, index) => {
      const skill = session.goal.skills.find((entry) => entry.id === day.skillId);
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
        topic: day.topic
      };
    });

    this.saveSession(session);

    return {
      diagnosticScores: session.diagnosticScores,
      learningPlan: session.learningPlan
    };
  }

  async getChallenge(userId, day) {
    const session = this.loadSession(userId);
    const planDay = session.learningPlan.find((entry) => entry.day === parseInt(day, 10));

    if (!planDay) {
      throw new Error(`Day ${day} not found in learning plan`);
    }

    let challenge = this.challengeEngine.getChallengeForDay(planDay, session);

    if (challenge.source === 'fallback' && this.openAI.isEnabled()) {
      const generated = await this.openAI.generateChallenge({
        goalText: session.goal.goalText,
        profile: session.goal.profile,
        planDay,
        recentWeaknesses: session.sessions.slice(-3).flatMap((entry) => entry.weaknesses || []).slice(0, 4)
      });

      if (generated) {
        challenge = {
          ...generated,
          source: 'llm'
        };
      }
    }

    return { planDay, challenge };
  }

  async submitSession({ userId, day, skillId, challenge, userResponse }) {
    const session = this.loadSession(userId);
    const evaluation = this.evaluator.scoreSession(challenge, userResponse);
    const completedAt = new Date().toISOString();
    const skill = session.goal.skills.find((entry) => entry.id === skillId);

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
      completedAt
    };

    session.sessions.push(record);

    session.learningPlan = session.learningPlan.map((entry) =>
      entry.day === Number(day)
        ? { ...entry, completed: true, score: evaluation.score }
        : entry
    );

    if (skill) {
      skill.sessionsCompleted += 1;
      skill.mastery = Math.round(
        session.sessions
          .filter((entry) => entry.skillId === skillId)
          .reduce((sum, entry) => sum + entry.score, 0) /
        session.sessions.filter((entry) => entry.skillId === skillId).length
      );
      skill.status = skill.mastery >= 75 ? 'complete' : 'active';
    }

    const adaptationResult = this.adaptor.apply(session.learningPlan, session.sessions, session.goal.skills);
    session.learningPlan = adaptationResult.learningPlan;
    if (adaptationResult.message) {
      session.adaptations.push(adaptationResult.message);
      if (!session.agentDecisions) session.agentDecisions = [];
      session.agentDecisions.push({
        id: session.agentDecisions.length + 1,
        timestamp: new Date().toISOString(),
        type: 'adaptation',
        icon: '⚡',
        title: 'Plan Adapted',
        detail: adaptationResult.message,
        reasoning: `Agent monitors rolling average score every 3 sessions. Scores < 50 → adds 2 review days. Scores > 88 → removes 1 day to avoid over-practice.`
      });
    }

    if (!session.agentDecisions) session.agentDecisions = [];
    session.agentDecisions.push({
      id: session.agentDecisions.length + 1,
      timestamp: new Date().toISOString(),
      type: 'session_complete',
      icon: '✅',
      title: `Day ${day} Session Scored`,
      detail: `Score: ${evaluation.score}% (${evaluation.grade}). Strengths: ${evaluation.strengths.slice(0, 2).join(', ')}. Gaps: ${evaluation.weaknesses.slice(0, 2).join(', ')}.`,
      reasoning: `Evaluated against ${challenge.evaluation_criteria?.length || 0} criteria. Awarded points for criteria coverage, response depth, reasoning patterns, and technical accuracy.`
    });

    this.saveSession(session);

    return {
      evaluation,
      adaptations: session.adaptations,
      nextDay: session.learningPlan.find((entry) => !entry.completed)?.day || null
    };
  }

  async generateReport(userId) {
    const session = this.loadSession(userId);
    let llmReport = null;

    if (this.openAI.isEnabled()) {
      llmReport = await this.openAI.generateReport({
        goalText: session.goal.goalText,
        domainLabel: session.goal.domainLabel,
        profile: session.goal.profile,
        sessions: session.sessions.map((entry) => ({
          day: entry.day,
          skillName: entry.skillName,
          score: entry.score,
          grade: entry.grade,
          strengths: entry.strengths,
          weaknesses: entry.weaknesses
        })),
        skills: session.goal.skills.map((skill) => ({
          name: skill.name,
          mastery: skill.mastery,
          status: skill.status
        })),
        adaptations: session.adaptations
      });
    }

    session.report = this.reportGenerator.generate(session, llmReport);
    this.saveSession(session);
    return session.report;
  }

  getDashboard(userId) {
    const session = this.loadSession(userId);
    const scores = session.sessions.map((entry) => entry.score);
    const stats = {
      avgScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
      bestScore: scores.length ? Math.max(...scores) : 0,
      totalSessions: session.sessions.length,
      completedDays: session.learningPlan.filter((entry) => entry.completed).length
    };

    return {
      goal: session.goal,
      skillTree: session.skillTree,
      learningPlan: session.learningPlan,
      sessions: session.sessions,
      stats,
      adaptations: session.adaptations,
      diagnosticScores: session.diagnosticScores,
      agentDecisions: session.agentDecisions || []
    };
  }

  async enhanceSkillTree(goalText, baseSkillTree) {
    if (!this.openAI.isEnabled()) {
      return baseSkillTree;
    }

    const enhancement = await this.openAI.generateGoalEnhancement({
      goalText,
      domain: baseSkillTree.domain,
      domainName: baseSkillTree.domainName,
      profile: baseSkillTree.profile,
      staticSkills: baseSkillTree.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        level: skill.level,
        days: skill.days,
        topics: skill.topics
      }))
    });

    if (!enhancement) {
      return baseSkillTree;
    }

    const mergedProfile = {
      ...baseSkillTree.profile,
      targetRole: enhancement.targetRole || baseSkillTree.profile.targetRole,
      learnerLevel: enhancement.learnerLevel || baseSkillTree.profile.learnerLevel,
      intensity: enhancement.intensity || baseSkillTree.profile.intensity,
      detectedTools: enhancement.detectedTools?.length ? enhancement.detectedTools : baseSkillTree.profile.detectedTools,
      focusKeywords: enhancement.focusKeywords?.length ? enhancement.focusKeywords : baseSkillTree.profile.focusKeywords,
      learningPreferences: enhancement.learningPreferences || null
    };

    const customSkills = (enhancement.customSkills || []).map((skill) => ({
      ...skill,
      source: 'llm',
      recommendedFor: mergedProfile.targetRole
    }));

    const byId = new Map();
    [...baseSkillTree.skills, ...customSkills].forEach((skill) => {
      if (!byId.has(skill.id)) {
        byId.set(skill.id, skill);
      }
    });

    let mergedSkills = Array.from(byId.values());
    if (enhancement.recommendedOrder?.length) {
      const orderMap = new Map(enhancement.recommendedOrder.map((id, index) => [id, index]));
      mergedSkills = mergedSkills.sort((left, right) => {
        const leftOrder = orderMap.has(left.id) ? orderMap.get(left.id) : 999;
        const rightOrder = orderMap.has(right.id) ? orderMap.get(right.id) : 999;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }
        return 0;
      });
    }

    return {
      ...baseSkillTree,
      profile: mergedProfile,
      skills: mergedSkills
    };
  }

  async enrichQuestions(goalText, diagnosticQuestions, profile, skills) {
    if (!this.openAI.isEnabled()) {
      return diagnosticQuestions;
    }

    const questionGroups = new Map();
    diagnosticQuestions.forEach((question) => {
      if (!questionGroups.has(question.skillId)) {
        questionGroups.set(question.skillId, []);
      }
      questionGroups.get(question.skillId).push(question);
    });

    for (const skill of skills) {
      const questions = questionGroups.get(skill.id) || [];
      const needsLLM = questions.length < 2 || questions.some((question) => question.source === 'fallback') || skill.source === 'llm';
      if (!needsLLM) {
        continue;
      }

      const generated = await this.openAI.generateQuestions({
        goalText,
        profile,
        skill: {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          level: skill.level,
          topics: skill.topics,
          reason: skill.reason || ''
        },
        staticQuestions: questions.map((question) => ({
          question: question.question,
          type: question.type,
          keyConcepts: question.key_concepts || []
        }))
      });

      if (generated?.questions?.length) {
        questionGroups.set(skill.id, generated.questions.slice(0, 2).map((question, index) => ({
          ...question,
          id: `${question.id || `q_${skill.id}_llm_${index + 1}`}_${skill.id}_${index + 1}`,
          skillId: skill.id,
          skillName: skill.name,
          targetRole: profile?.targetRole || null,
          personalizationHint: skill.reason || `Generated for ${skill.name}`,
          source: 'llm'
        })));
      }
    }

    return skills.flatMap((skill) => questionGroups.get(skill.id) || []);
  }

  loadSession(userId) {
    const sessionPath = join(DATA_DIR, `${userId}.json`);
    if (!existsSync(sessionPath)) {
      throw new Error(`Session not found: ${userId}`);
    }

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
      flask: 'https://flask.palletsprojects.com/',
      fastapi: 'https://fastapi.tiangolo.com/',
      react: 'https://react.dev/',
      node: 'https://nodejs.org/en/docs',
      sql: 'https://www.postgresql.org/docs/',
      tensorflow: 'https://www.tensorflow.org/learn',
      pytorch: 'https://pytorch.org/tutorials/'
    };

    for (const tool of profile?.detectedTools || []) {
      if (toolResources[tool]) {
        resources.push(toolResources[tool]);
      }
    }

    if (skill?.topics?.length) {
      resources.push(`Practice focus: ${skill.topics.slice(0, 2).join(', ')}`);
    }

    return [...new Set(resources)].slice(0, 4);
  }
}

export default SmartAgent;
