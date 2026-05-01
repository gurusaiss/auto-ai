import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

class QuizGenerator {
  constructor() {
    const questionsPath = join(__dirname, '../knowledge/questions.json');
    this.questions = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  }

  scoreQuestionRelevance(question, skill, profile) {
    const searchableText = [
      question.question,
      ...(question.key_concepts || []),
      ...(question.score_keywords || [])
    ].join(' ').toLowerCase();

    let score = 0;
    for (const keyword of profile?.focusKeywords || []) {
      if (searchableText.includes(keyword)) {
        score += keyword.length > 5 ? 3 : 2;
      }
    }

    for (const tool of profile?.detectedTools || []) {
      if (searchableText.includes(tool)) {
        score += 4;
      }
    }

    if (question.type === 'open_ended') {
      score += 1;
    }

    if ((skill.topics || []).some((topic) => searchableText.includes(topic.toLowerCase()))) {
      score += 2;
    }

    return score;
  }

  personalizeQuestion(question, skill, profile, index) {
    const roleContext = profile?.targetRole ? ` for your ${profile.targetRole} goal` : '';
    const personalizedPrompt = question.type === 'open_ended'
      ? `${question.question} Answer${roleContext} with one practical example.`
      : question.question;

    return {
      ...question,
      id: `${question.id}_${skill.id}_${index + 1}`,
      question: personalizedPrompt,
      skillId: skill.id,
      skillName: skill.name,
      targetRole: profile?.targetRole || null,
      personalizationHint: skill.reason || `Important for ${skill.name}.`,
      source: 'static'
    };
  }

  buildFallbackQuestions(skill, profile) {
    const roleContext = profile?.targetRole ? ` as a ${profile.targetRole}` : '';
    const topics = skill.topics || [];
    const t0 = topics[0] || skill.name;
    const t1 = topics[1] || 'practical techniques';
    const t2 = topics[2] || 'real-world usage';
    const t3 = topics[3] || 'best practices';

    return [
      {
        id: `q_${skill.id}_fallback_1`,
        skillId: skill.id,
        skillName: skill.name,
        question: `Explain what "${t0}" means in the context of ${skill.name}${roleContext}. Why is it important, and give one practical example of how you would use it.`,
        type: 'open_ended',
        options: [],
        correct: '',
        explanation: `"${t0}" is a core concept in ${skill.name}. A good answer defines it, explains its importance, and gives a concrete example.`,
        key_concepts: [t0, skill.name],
        score_keywords: topics,
        sample_good_answer: `"${t0}" in ${skill.name} refers to... It matters because... A practical example is when you...`,
        source: 'fallback'
      },
      {
        id: `q_${skill.id}_fallback_2`,
        skillId: skill.id,
        skillName: skill.name,
        question: `You are building a project that requires ${skill.name}${roleContext}. You need to handle "${t1}". Walk through your approach, and explain how "${t2}" and "${t3}" factor into your decision.`,
        type: 'open_ended',
        options: [],
        correct: '',
        explanation: `This tests practical problem-solving in ${skill.name} — specifically whether you can connect ${t1}, ${t2}, and ${t3} in a real scenario.`,
        key_concepts: [t1, t2, t3],
        score_keywords: topics,
        sample_good_answer: `To handle "${t1}", I would first... I would then apply "${t2}" by... and keep "${t3}" in mind by...`,
        source: 'fallback'
      }
    ];
  }

  generate(skillTree) {
    const diagnosticQuestions = [];
    const profile = skillTree.profile || {};

    for (const skill of skillTree.skills) {
      const skillQuestions = this.questions[skill.id];

      if (skillQuestions && skillQuestions[skill.level]) {
        const levelQuestions = [...skillQuestions[skill.level]];
        const selectedQuestions = levelQuestions
          .sort((left, right) => this.scoreQuestionRelevance(right, skill, profile) - this.scoreQuestionRelevance(left, skill, profile))
          .slice(0, 2);

        selectedQuestions.forEach((question, index) => {
          diagnosticQuestions.push(this.personalizeQuestion(question, skill, profile, index));
        });
      } else {
        this.buildFallbackQuestions(skill, profile).forEach((question) => {
          diagnosticQuestions.push(question);
        });
      }
    }

    return diagnosticQuestions;
  }
}

export default QuizGenerator;
