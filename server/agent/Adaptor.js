class Adaptor {
  apply(learningPlan, sessions, skills) {
    if (sessions.length === 0 || sessions.length % 3 !== 0) {
      return { learningPlan, message: null };
    }

    const recent = sessions.slice(-3);
    const average = recent.reduce((sum, session) => sum + session.score, 0) / recent.length;
    const currentSkillId = recent[recent.length - 1].skillId;
    const currentSkill = skills.find((skill) => skill.id === currentSkillId);

    if (average < 50) {
      const maxDay = learningPlan.reduce((max, item) => Math.max(max, item.day), 0);
      const extraDays = [1, 2].map((offset) => ({
        day: maxDay + offset,
        skillId: currentSkillId,
        skillName: currentSkill?.name || currentSkillId,
        objective: `Review and reinforce ${currentSkill?.name || currentSkillId}.`,
        sessionType: 'review',
        estimatedMinutes: 25,
        resources: ['https://developer.mozilla.org/'],
        completed: false,
        score: null,
        addedByAgent: true,
        challengeId: `review_${currentSkillId}_${maxDay + offset}`,
        topic: currentSkill?.topics?.[(offset - 1) % (currentSkill?.topics?.length || 1)] || 'review'
      }));

      return {
        learningPlan: [...learningPlan, ...extraDays],
        message: `Agent update: added 2 extra review days for ${currentSkill?.name || currentSkillId} because your recent average was ${Math.round(average)}.`
      };
    }

    if (average > 88) {
      return {
        learningPlan,
        message: `Agent update: you are advancing faster in ${currentSkill?.name || currentSkillId}. Recent average: ${Math.round(average)}.`
      };
    }

    return { learningPlan, message: null };
  }
}

export default Adaptor;
