import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import GeminiService from '../services/GeminiService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class QuizGenerator {
  constructor() {
    const questionsPath = join(__dirname, '../knowledge/questions.json');
    this.questions = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  }

  // ── Gemini-powered: 10 domain-specific MCQ questions ────────────────────
  async generateWithLLM(skillTree) {
    const { profile, skills, domain } = skillTree;
    const domainLabel = skillTree.domainName || domain;
    const goalText = profile?.rawGoal || domainLabel;
    const skillList = skills.slice(0, 6).map((s, i) =>
      `${i + 1}. ${s.name} (topics: ${(s.topics || []).slice(0, 4).join(', ')})`
    ).join('\n');

    const prompt = `You are an expert assessment designer. Create a diagnostic quiz for someone who wants to: "${goalText}"

Domain: ${domainLabel}
Learner level: ${profile?.learnerLevel || 'beginner'}
Skills to assess:
${skillList}

Generate exactly 10 multiple-choice questions that directly test knowledge of "${domainLabel}".
Questions must use REAL concepts from ${domainLabel} — not generic learning concepts.

Example for tailoring: ask about seam allowance, fabric grain, dart placement, stitch types, pattern pieces.
Example for cooking: ask about knife cuts, mise en place, Maillard reaction, sauté vs braise.
Example for music: ask about time signatures, chord progressions, intervals, dynamics.

Return ONLY valid JSON — no markdown, no explanation:
{
  "questions": [
    {
      "id": "q1",
      "skillId": "exact_skill_id_from_list_above",
      "skillName": "Exact Skill Name",
      "question": "What is the standard seam allowance used in most commercial sewing patterns?",
      "type": "multiple_choice",
      "options": [
        "A) 1/4 inch (6mm)",
        "B) 5/8 inch (15mm)",
        "C) 1 inch (25mm)",
        "D) 3/8 inch (10mm)"
      ],
      "correct": "B) 5/8 inch (15mm)",
      "explanation": "5/8 inch is the standard seam allowance in most commercial patterns because it allows enough fabric to press seams open cleanly.",
      "key_concepts": ["seam allowance", "pattern making"],
      "score_keywords": ["5/8", "15mm", "standard"]
    }
  ]
}

Rules:
- ALL 10 questions must be type "multiple_choice"
- Each question must have EXACTLY 4 options labeled A) B) C) D)
- "correct" must exactly match one of the 4 options
- Distribute 2 questions per skill (use the exact skillId from the list above)
- Questions must test REAL ${domainLabel} knowledge — no generic questions
- Difficulty: appropriate for ${profile?.learnerLevel || 'beginner'} level
- Each question must be clearly different (no repeats)`;

    try {
      const result = await GeminiService.generateJSON(prompt,
        `You are an expert quiz designer for ${domainLabel}. Return ONLY valid JSON. Every question must be multiple_choice with 4 options A) B) C) D). NO open-ended questions.`);

      if (result?.questions?.length >= 8) {
        // Force all to multiple_choice and validate
        const validated = result.questions
          .filter(q => q.question && q.options?.length === 4 && q.correct)
          .map((q, i) => ({
            ...q,
            id: q.id || `q${i + 1}`,
            type: 'multiple_choice',
            source: 'llm',
            options: q.options.map(o => {
              // Ensure options start with A) B) C) D)
              if (/^[A-D]\)/.test(o)) return o;
              const label = ['A', 'B', 'C', 'D'][q.options.indexOf(o)];
              return `${label}) ${o}`;
            }),
          }));

        if (validated.length >= 8) {
          console.log(`[QuizGenerator] Gemini generated ${validated.length} MCQ questions for "${domainLabel}"`);
          return validated;
        }
      }
    } catch (err) {
      console.error('[QuizGenerator] Gemini error:', err.message);
    }
    return null;
  }

  // ── Varied fallback MCQ templates — avoid repeating same pattern ────────
  buildFallbackMCQ(skill, topicIndex = 0) {
    const topics = skill.topics || [];
    const t  = topics[topicIndex % topics.length] || skill.name;
    const t2 = topics[(topicIndex + 1) % Math.max(topics.length, 1)] || 'practical application';
    const t3 = topics[(topicIndex + 2) % Math.max(topics.length, 1)] || 'fundamentals';
    const t4 = topics[(topicIndex + 3) % Math.max(topics.length, 1)] || 'advanced techniques';

    // Rotate through 6 different question formats so the quiz feels varied
    const templateId = topicIndex % 6;

    const templates = [
      // 0 — definition / role
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
      // 1 — sequence / when
      {
        question: `At which stage of learning ${skill.name} is "${t}" most important?`,
        options: [
          `A) At the very beginning — it sets the foundation for everything else`,
          `B) Only after mastering ${t4}`,
          `C) It is equally important at all stages and has no particular starting point`,
          `D) Only when preparing for ${t3}`,
        ],
        correct: `A) At the very beginning — it sets the foundation for everything else`,
        explanation: `"${t}" is introduced early in ${skill.name} because it underpins more advanced concepts like ${t2}.`,
      },
      // 2 — true/false style
      {
        question: `Which statement about "${t}" in ${skill.name} is CORRECT?`,
        options: [
          `A) "${t}" must be understood before progressing to ${t2}`,
          `B) "${t}" is only relevant to professionals — beginners can skip it`,
          `C) "${t}" and "${t3}" are interchangeable concepts`,
          `D) "${t}" is a recent innovation and not widely taught`,
        ],
        correct: `A) "${t}" must be understood before progressing to ${t2}`,
        explanation: `Understanding "${t}" is a prerequisite in ${skill.name} — it directly enables the learner to work with ${t2} and beyond.`,
      },
      // 3 — application / how
      {
        question: `How would a beginner in ${skill.name} apply knowledge of "${t}"?`,
        options: [
          `A) By using it as a starting point to build ${t2} and ${t3} skills`,
          `B) By memorising definitions without any hands-on practice`,
          `C) By applying it only in ${t4} projects`,
          `D) By combining it exclusively with ${t3} and ignoring ${t2}`,
        ],
        correct: `A) By using it as a starting point to build ${t2} and ${t3} skills`,
        explanation: `Hands-on application of "${t}" helps reinforce ${skill.name} fundamentals and creates a bridge to ${t2}.`,
      },
      // 4 — relationship between concepts
      {
        question: `What is the relationship between "${t}" and "${t2}" in ${skill.name}?`,
        options: [
          `A) "${t}" comes first and provides the basis for understanding "${t2}"`,
          `B) They are unrelated concepts taught in separate modules`,
          `C) "${t2}" must be learned before "${t}" can be applied`,
          `D) Only one of them is needed — learners choose which to study`,
        ],
        correct: `A) "${t}" comes first and provides the basis for understanding "${t2}"`,
        explanation: `In ${skill.name}, "${t}" is prerequisite knowledge that makes "${t2}" easier to grasp and apply.`,
      },
      // 5 — importance / why
      {
        question: `Why is "${t}" considered essential for mastering ${skill.name}?`,
        options: [
          `A) It is the foundational concept that all other ${skill.name} skills are built upon`,
          `B) It is only essential for instructors, not for learners`,
          `C) It speeds up ${t4} but has no impact on ${t2}`,
          `D) Its importance is debated — many practitioners skip it`,
        ],
        correct: `A) It is the foundational concept that all other ${skill.name} skills are built upon`,
        explanation: `Mastery of "${t}" gives learners the conceptual foundation to progress through ${t2}, ${t3}, and ${t4} with confidence.`,
      },
    ];

    const tpl = templates[templateId];
    return {
      id: `q_${skill.id}_mcq_${topicIndex}`,
      skillId: skill.id,
      skillName: skill.name,
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

  // ── Try static knowledge bank, filter to MCQ only ───────────────────────
  getStaticMCQ(skill, profile) {
    const skillQuestions = this.questions[skill.id];
    if (!skillQuestions) return [];

    const levelQuestions = skillQuestions[skill.level] || skillQuestions['beginner'] || [];
    return levelQuestions
      .filter(q => q.type === 'multiple_choice')
      .sort((a, b) => this._scoreRelevance(b, skill, profile) - this._scoreRelevance(a, skill, profile))
      .slice(0, 2)
      .map((q, i) => ({
        ...q,
        id: `${q.id}_${skill.id}_${i + 1}`,
        skillId: skill.id,
        skillName: skill.name,
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

  // ── Main entry — Gemini first, then static, then fallback ────────────────
  async generate(skillTree) {
    const profile = skillTree.profile || {};

    // 1. Try Gemini for domain-specific MCQ questions
    if (GeminiService.isEnabled()) {
      const llmQuestions = await this.generateWithLLM(skillTree);
      if (llmQuestions && llmQuestions.length >= 8) {
        return llmQuestions;
      }
    }

    // 2. Rule-based fallback — MCQ only from static bank + generated
    const diagnosticQuestions = [];

    for (const skill of skillTree.skills) {
      // Try static MCQ questions first
      const staticMCQ = this.getStaticMCQ(skill, profile);
      if (staticMCQ.length >= 2) {
        diagnosticQuestions.push(...staticMCQ.slice(0, 2));
      } else if (staticMCQ.length === 1) {
        diagnosticQuestions.push(staticMCQ[0]);
        diagnosticQuestions.push(this.buildFallbackMCQ(skill, 1));
      } else {
        // No static MCQ — use generated MCQ
        diagnosticQuestions.push(this.buildFallbackMCQ(skill, 0));
        diagnosticQuestions.push(this.buildFallbackMCQ(skill, 1));
      }
    }

    return diagnosticQuestions;
  }
}

export default QuizGenerator;
