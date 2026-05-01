import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

class ChallengeEngine {
  constructor() {
    this.challenges = JSON.parse(readFileSync(join(__dirname, '../knowledge/challenges.json'), 'utf-8'));
  }

  personalizeChallenge(challenge, planDay, session) {
    const roleContext = session?.goal?.profile?.targetRole ? ` for your ${session.goal.profile.targetRole} path` : '';
    const weakSignal = session?.sessions?.length
      ? session.sessions.slice(-3).flatMap((entry) => entry.weaknesses || []).slice(0, 2).join(' ')
      : '';

    return {
      ...challenge,
      source: 'static',
      title: `${challenge.title}${roleContext}`,
      description: `${challenge.description} Focus especially on ${planDay.topic}.${weakSignal ? ` Recent weak spots to address: ${weakSignal}.` : ''}`,
      hints: [
        ...(challenge.hints || []),
        `Tie your answer back to ${planDay.topic}.`,
        session?.goal?.profile?.detectedTools?.length
          ? `Use examples with ${session.goal.profile.detectedTools.slice(0, 2).join(' and ')} if relevant.`
          : 'Use one practical, real-world example.'
      ].slice(0, 5),
      evaluation_criteria: [...new Set([...(challenge.evaluation_criteria || []), planDay.topic, planDay.skillName.toLowerCase()])],
      model_solution: `${challenge.model_solution} A strong response should feel relevant to ${session?.goal?.profile?.targetRole || planDay.skillName}.`
    };
  }

  buildDynamicChallenge(planDay, session) {
    const topic = planDay.topic || planDay.skillName;
    const skillName = planDay.skillName || planDay.skillId;
    const goal = session?.goal?.goalText || skillName;
    const role = session?.goal?.profile?.targetRole;
    const roleContext = role ? ` for your ${role} path` : '';
    const sessionType = planDay.sessionType || 'practice';

    const recentWeaknesses = session?.sessions
      ?.slice(-3)
      .flatMap((s) => s.weaknesses || [])
      .slice(0, 2) || [];

    const challengeTemplates = {
      concept: {
        title: `Explain ${topic} — ${skillName}${roleContext}`,
        description: `In your own words, explain "${topic}" and how it is used in ${skillName}. Cover: what it is, why it matters, and a concrete real-world scenario where you would apply it.`,
        hints: [
          `Define "${topic}" clearly before diving into examples.`,
          `Think of a real project or scenario where "${topic}" comes up.`,
          `Connect "${topic}" back to the bigger picture of ${skillName}.`
        ]
      },
      practice: {
        title: `Apply ${topic} in a ${skillName} project${roleContext}`,
        description: `You are working on a project that needs ${skillName}. Specifically, you need to implement or handle "${topic}". Describe your step-by-step approach, the decisions you make, and why.`,
        hints: [
          `Start by identifying what "${topic}" requires in this context.`,
          `Walk through your solution step-by-step — don't skip reasoning.`,
          `Mention any edge cases or pitfalls to watch out for.`
        ]
      },
      review: {
        title: `Review & reinforce ${topic}${roleContext}`,
        description: `You've been working on ${skillName}. Review your understanding of "${topic}" by explaining it to a junior developer. What are the most common mistakes? How do you avoid them?`,
        hints: [
          `Think about what confused you most when first learning "${topic}".`,
          `Give at least one "do this, not that" example.`,
          `Explain the mental model that makes "${topic}" click.`
        ]
      }
    };

    const template = challengeTemplates[sessionType] || challengeTemplates.practice;

    const weaknessHint = recentWeaknesses.length
      ? `Pay special attention to these recent weak spots: ${recentWeaknesses.join(', ')}.`
      : null;

    return {
      id: planDay.challengeId || `ch_${planDay.skillId}_day${planDay.day}`,
      day_range: [planDay.day, planDay.day],
      type: sessionType,
      source: 'dynamic',
      title: template.title,
      description: `${template.description}${weaknessHint ? ` ${weaknessHint}` : ''}`,
      hints: [
        ...template.hints,
        ...(weaknessHint ? [weaknessHint] : [])
      ].slice(0, 4),
      evaluation_criteria: [
        `understanding of ${topic}`,
        `practical application in ${skillName}`,
        'clear reasoning and examples',
        'connection to real use cases'
      ],
      model_solution: `A strong response defines "${topic}", shows how it applies in ${skillName} with a concrete example, and explains the reasoning — not just the steps.`
    };
  }

  getChallengeForDay(planDay, session = null) {
    const options = this.challenges[planDay.skillId] || [];
    const challenge = options.find((entry) => entry.id === planDay.challengeId)
      || options.find((entry) => {
        const [start, end] = entry.day_range || [planDay.day, planDay.day];
        return planDay.day >= start && planDay.day <= end;
      })
      || options[0];

    if (challenge) {
      return this.personalizeChallenge(challenge, planDay, session);
    }

    return this.buildDynamicChallenge(planDay, session);
  }
}

export default ChallengeEngine;
