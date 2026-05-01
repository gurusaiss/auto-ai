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

  // ── Build domain-specific MCQ fallback (no Gemini) ──────────────────────
  buildFallbackMCQ(skill, topicIndex = 0) {
    const topics = skill.topics || [];
    const t = topics[topicIndex % topics.length] || skill.name;
    const t2 = topics[(topicIndex + 1) % Math.max(topics.length, 1)] || 'practical application';
    const t3 = topics[(topicIndex + 2) % Math.max(topics.length, 1)] || 'fundamentals';
    const t4 = topics[(topicIndex + 3) % Math.max(topics.length, 1)] || 'advanced techniques';

    return {
      id: `q_${skill.id}_mcq_${topicIndex}`,
      skillId: skill.id,
      skillName: skill.name,
      question: `Which of the following best describes "${t}" in the context of ${skill.name}?`,
      type: 'multiple_choice',
      options: [
        `A) It is the primary concept that defines ${t} in ${skill.name}`,
        `B) It relates to ${t2} and is foundational to mastering ${skill.name}`,
        `C) It is primarily used in advanced ${t3} workflows`,
        `D) It is an optional enhancement for ${t4}`,
      ],
      correct: `A) It is the primary concept that defines ${t} in ${skill.name}`,
      explanation: `"${t}" is fundamental to ${skill.name} and is one of the first concepts a learner must master.`,
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
