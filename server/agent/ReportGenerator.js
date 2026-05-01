class ReportGenerator {
  generate(session, llmReport = null) {
    const avgScore = session.sessions.length
      ? Math.round(session.sessions.reduce((sum, item) => sum + item.score, 0) / session.sessions.length)
      : 0;
    const bestScore = session.sessions.length
      ? Math.max(...session.sessions.map((item) => item.score))
      : 0;
    const completedSkills = session.goal.skills.filter((skill) => skill.mastery >= 65);

    return {
      generatedAt: new Date().toISOString(),
      goalText: session.goal.goalText,
      summary: {
        avgScore,
        bestScore,
        totalSessions: session.sessions.length,
        completedDays: session.learningPlan.filter((item) => item.completed).length
      },
      skills: session.goal.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        mastery: skill.mastery,
        status: skill.mastery >= 65 ? 'demonstrated' : skill.status
      })),
      demonstratedSkills: llmReport?.demonstratedSkills?.length ? llmReport.demonstratedSkills : completedSkills.map((skill) => skill.name),
      narrative: llmReport?.narrative || `SkillForge tracked ${session.sessions.length} practice sessions and found steady growth toward ${session.goal.domainLabel}. The learner performed best when responses were detailed, reasoned, and directly tied to the evaluation criteria.`,
      coachSummary: llmReport?.coachSummary || 'Continue focusing on weak areas and build consistency through repeated practice.',
      sessions: session.sessions,
      adaptations: session.adaptations,
      agentDecisions: session.agentDecisions || [],
      diagnosticScores: session.diagnosticScores || {},
      totalDays: session.goal.totalEstimatedDays || 0,
      domain: session.goal.domainLabel || '',
      domainIcon: session.goal.domainIcon || '🚀',
      profile: session.goal.profile || {}
    };
  }
}

export default ReportGenerator;
