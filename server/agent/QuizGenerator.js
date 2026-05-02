import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import GeminiService from '../services/GeminiService.js';
import RuleBase from './RuleBase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TARGET_QUESTIONS = 5; // Always exactly 5 questions

class QuizGenerator {
  constructor() {
    const questionsPath = join(__dirname, '../knowledge/questions.json');
    this.questions = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  }

  // ── STEP 1: Rule-based quiz (highest priority, no API call) ──────────────
  getRuleBasedQuiz(skillTree) {
    const domainId = skillTree.domain || 'custom';
    const goalText = skillTree.profile?.rawGoal || '';

    const questions = RuleBase.getQuiz(domainId, goalText);
    if (!questions || questions.length === 0) return null;

    console.log(`[QuizGenerator] ✅ Rule-base hit for domain "${domainId}" — ${questions.length} questions`);
    // Add concept field fallback, mark source
    return questions.slice(0, TARGET_QUESTIONS).map((q, i) => ({
      ...q,
      concept: q.concept || q.skillName,
      source: 'rule_base',
    }));
  }

  // ── STEP 2: Gemini-powered domain-specific quiz ──────────────────────────
  async generateWithLLM(skillTree) {
    const { profile, skills, domain } = skillTree;
    const domainLabel = skillTree.domainName || domain;
    const goalText = profile?.rawGoal || domainLabel;
    const skillList = skills.slice(0, 5).map((s, i) =>
      `${i + 1}. ${s.name} (id: ${s.id}, topics: ${(s.topics || []).slice(0, 3).join(', ')})`
    ).join('\n');

    const prompt = `You are an expert assessment designer. Create a diagnostic quiz for: "${goalText}"

Domain: ${domainLabel}
Learner level: ${profile?.learnerLevel || 'beginner'}
Skills to assess:
${skillList}

Generate EXACTLY ${TARGET_QUESTIONS} multiple-choice questions (one per difficulty level).
Each question MUST test REAL ${domainLabel} knowledge — no generic learning theory questions.

Difficulty order: 1=basic, 2=moderate, 3=advanced, 4=practical, 5=real_world

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "skillId": "exact_skill_id_from_list",
      "skillName": "Exact Skill Name",
      "concept": "The specific concept being tested (e.g. 'Seam Allowance', 'Maillard Reaction', 'Virtual DOM')",
      "difficulty": "basic",
      "question": "Specific question text using real ${domainLabel} terminology",
      "type": "multiple_choice",
      "options": [
        "A) correct or plausible answer",
        "B) plausible but wrong",
        "C) plausible but wrong",
        "D) wrong"
      ],
      "correct": "A) correct or plausible answer",
      "explanation": "Why this is correct in the context of ${domainLabel}.",
      "key_concepts": ["concept1", "concept2"],
      "score_keywords": ["keyword1", "keyword2"]
    }
  ]
}

Rules:
- ALL ${TARGET_QUESTIONS} questions must be type "multiple_choice"
- Each must have EXACTLY 4 options labeled A) B) C) D)
- "correct" must EXACTLY match one option
- Each question covers a DIFFERENT difficulty: basic, moderate, advanced, practical, real_world
- Questions must use REAL ${domainLabel} terms — no generic phrases
- "concept" field must name the specific topic tested (keep it short, ≤ 6 words)`;

    try {
      const result = await GeminiService.generateJSON(prompt,
        `Expert quiz designer for ${domainLabel}. Return only valid JSON. ${TARGET_QUESTIONS} MCQ questions only.`);

      if (result?.questions?.length >= TARGET_QUESTIONS - 1) {
        const validated = result.questions
          .filter(q => q.question && q.options?.length === 4 && q.correct)
          .map((q, i) => ({
            ...q,
            id: q.id || `q${i + 1}`,
            type: 'multiple_choice',
            concept: q.concept || q.skillName || 'Core Concept',
            source: 'llm',
            options: q.options.map(o => {
              if (/^[A-D]\)/.test(o)) return o;
              const label = ['A', 'B', 'C', 'D'][q.options.indexOf(o)];
              return `${label}) ${o}`;
            }),
          }));

        if (validated.length >= TARGET_QUESTIONS - 1) {
          console.log(`[QuizGenerator] Gemini generated ${validated.length} questions for "${domainLabel}"`);
          return validated.slice(0, TARGET_QUESTIONS);
        }
      }
    } catch (err) {
      console.error('[QuizGenerator] Gemini error:', err.message);
    }
    return null;
  }

  // ── STEP 3: Static bank (filtered to MCQ only) ────────────────────────────
  getStaticMCQ(skill, profile) {
    const skillQuestions = this.questions[skill.id];
    if (!skillQuestions) return [];
    const levelQuestions = skillQuestions[skill.level] || skillQuestions['beginner'] || [];
    return levelQuestions
      .filter(q => q.type === 'multiple_choice')
      .sort((a, b) => this._scoreRelevance(b, skill, profile) - this._scoreRelevance(a, skill, profile))
      .slice(0, 1)
      .map((q, i) => ({
        ...q,
        id: `${q.id}_${skill.id}_${i + 1}`,
        skillId: skill.id,
        skillName: skill.name,
        concept: q.concept || (q.key_concepts?.[0]) || skill.name,
        source: 'static',
      }));
  }

  _scoreRelevance(question, skill, profile) {
    const text = [question.question, ...(question.key_concepts || [])].join(' ').toLowerCase();
    let score = 0;
    for (const kw of profile?.focusKeywords || []) {
      if (text.includes(kw)) score += kw.length > 5 ? 3 : 2;
    }
    for (const tool of profile?.detectedTools || []) {
      if (text.includes(tool)) score += 4;
    }
    return score;
  }

  // ── STEP 4: Varied fallback generator (6 templates, domain-aware topics) ──
  buildFallbackMCQ(skill, topicIndex = 0) {
    const topics = skill.topics || [];
    const t  = topics[topicIndex % topics.length] || skill.name;
    const t2 = topics[(topicIndex + 1) % Math.max(topics.length, 1)] || 'practical application';
    const t3 = topics[(topicIndex + 2) % Math.max(topics.length, 1)] || 'fundamentals';
    const t4 = topics[(topicIndex + 3) % Math.max(topics.length, 1)] || 'advanced techniques';

    const DIFFICULTIES = ['basic', 'moderate', 'advanced', 'practical', 'real_world'];
    const templateId = topicIndex % 6;

    const templates = [
      {
        question: `What is the primary purpose of "${t}" when learning ${skill.name}?`,
        options: [
          `A) It establishes the foundational knowledge needed for ${skill.name}`,
          `B) It is only used in advanced ${t3} scenarios`,
          `C) It replaces the need to understand ${t2}`,
          `D) It is an optional concept that can be skipped`,
        ],
        correct: `A) It establishes the foundational knowledge needed for ${skill.name}`,
        explanation: `"${t}" is a core element of ${skill.name} that learners encounter early and build upon throughout their training.`,
      },
      {
        question: `At which stage of learning ${skill.name} is "${t}" most important?`,
        options: [
          `A) At the very beginning — it sets the foundation for everything else`,
          `B) Only after mastering ${t4}`,
          `C) It is equally important at all stages`,
          `D) Only when preparing for ${t3}`,
        ],
        correct: `A) At the very beginning — it sets the foundation for everything else`,
        explanation: `"${t}" is introduced early in ${skill.name} because it underpins more advanced concepts like ${t2}.`,
      },
      {
        question: `Which statement about "${t}" in ${skill.name} is CORRECT?`,
        options: [
          `A) "${t}" must be understood before progressing to ${t2}`,
          `B) "${t}" is only relevant to professionals, not beginners`,
          `C) "${t}" and "${t3}" are interchangeable concepts`,
          `D) "${t}" is a recent innovation and not widely practised`,
        ],
        correct: `A) "${t}" must be understood before progressing to ${t2}`,
        explanation: `Understanding "${t}" is prerequisite knowledge in ${skill.name}. It directly enables the learner to work with ${t2}.`,
      },
      {
        question: `How would a beginner in ${skill.name} apply knowledge of "${t}"?`,
        options: [
          `A) By using it as a starting point to build ${t2} and ${t3} skills`,
          `B) By memorising definitions without hands-on practice`,
          `C) By applying it only in ${t4} projects`,
          `D) By combining it exclusively with ${t3} and ignoring ${t2}`,
        ],
        correct: `A) By using it as a starting point to build ${t2} and ${t3} skills`,
        explanation: `Hands-on application of "${t}" reinforces ${skill.name} fundamentals and creates a bridge to ${t2}.`,
      },
      {
        question: `What is the relationship between "${t}" and "${t2}" in ${skill.name}?`,
        options: [
          `A) "${t}" comes first and provides the basis for understanding "${t2}"`,
          `B) They are unrelated concepts taught in separate modules`,
          `C) "${t2}" must be learned before "${t}" can be applied`,
          `D) Only one of them is needed — learners choose which to study`,
        ],
        correct: `A) "${t}" comes first and provides the basis for understanding "${t2}"`,
        explanation: `In ${skill.name}, "${t}" is prerequisite knowledge that makes "${t2}" easier to grasp.`,
      },
      {
        question: `Why is "${t}" considered essential for mastering ${skill.name}?`,
        options: [
          `A) It is foundational — all other ${skill.name} skills are built upon it`,
          `B) It is only essential for instructors, not learners`,
          `C) It speeds up ${t4} but has no impact on ${t2}`,
          `D) Its importance is debated — many practitioners skip it`,
        ],
        correct: `A) It is foundational — all other ${skill.name} skills are built upon it`,
        explanation: `Mastery of "${t}" gives learners the foundation to progress through ${t2}, ${t3}, and ${t4}.`,
      },
    ];

    const tpl = templates[templateId];
    return {
      id: `q_${skill.id}_mcq_${topicIndex}`,
      skillId: skill.id,
      skillName: skill.name,
      concept: t,
      difficulty: DIFFICULTIES[topicIndex % DIFFICULTIES.length],
      question: tpl.question,
      type: 'multiple_choice',
      options: tpl.options,
      correct: tpl.correct,
      explanation: tpl.explanation,
      key_concepts: [t, skill.name],
      score_keywords: [t],
      source: 'fallback',
    };
  }

  // ── Main entry: Rule-base → LLM → Static → Fallback ─────────────────────
  async generate(skillTree) {
    const profile = skillTree.profile || {};

    // ── Step 1: Rule-base first (no API call, highest quality for known domains)
    const ruleQuestions = this.getRuleBasedQuiz(skillTree);
    if (ruleQuestions && ruleQuestions.length >= TARGET_QUESTIONS - 1) {
      return this._ensureExactly5(ruleQuestions, skillTree);
    }

    // ── Step 2: Gemini for unknown domains
    if (GeminiService.isEnabled()) {
      const llmQuestions = await this.generateWithLLM(skillTree);
      if (llmQuestions && llmQuestions.length >= TARGET_QUESTIONS - 1) {
        return this._ensureExactly5(llmQuestions, skillTree);
      }
    }

    // ── Step 3: Static bank + generated fallback
    const diagnosticQuestions = [];
    for (const skill of skillTree.skills) {
      const staticMCQ = this.getStaticMCQ(skill, profile);
      diagnosticQuestions.push(...staticMCQ.slice(0, 1));
      if (diagnosticQuestions.length >= TARGET_QUESTIONS) break;
    }

    // Fill remaining with fallback questions across skills
    let skillIndex = 0;
    let topicIndex = 0;
    while (diagnosticQuestions.length < TARGET_QUESTIONS) {
      const skill = skillTree.skills[skillIndex % skillTree.skills.length];
      diagnosticQuestions.push(this.buildFallbackMCQ(skill, topicIndex));
      skillIndex++;
      topicIndex++;
    }

    return diagnosticQuestions.slice(0, TARGET_QUESTIONS);
  }

  // Ensures exactly 5 questions — pads with fallback if short
  _ensureExactly5(questions, skillTree) {
    if (questions.length >= TARGET_QUESTIONS) return questions.slice(0, TARGET_QUESTIONS);
    const padded = [...questions];
    let i = 0;
    while (padded.length < TARGET_QUESTIONS) {
      const skill = skillTree.skills[i % skillTree.skills.length];
      padded.push(this.buildFallbackMCQ(skill, padded.length));
      i++;
    }
    return padded;
  }
}

export default QuizGenerator;
