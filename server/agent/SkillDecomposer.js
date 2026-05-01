import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

class SkillDecomposer {
  constructor() {
    const domainsPath = join(__dirname, '../knowledge/domains.json');
    this.domains = JSON.parse(readFileSync(domainsPath, 'utf-8'));

    this.domainKeywords = {
      frontend_development: ['react', 'vue', 'angular', 'frontend', 'html', 'css', 'javascript', 'typescript', 'next.js', 'nuxt', 'tailwind', 'jsx', 'hooks', 'redux', 'sass', 'webpack', 'vite', 'svelte', 'components', 'web development', 'web app'],
      backend_development: ['backend', 'server', 'api', 'database', 'node', 'express', 'rest', 'sql', 'deployment', 'docker', 'python', 'django', 'flask'],
      machine_learning: ['machine learning', 'ml', 'neural', 'model', 'training', 'prediction', 'ai', 'deep learning', 'tensorflow', 'pytorch', 'llm', 'artificial intelligence'],
      ui_ux_design: ['design', 'ui', 'ux', 'interface', 'user experience', 'wireframe', 'prototype', 'figma', 'visual', 'interaction'],
      digital_marketing: ['marketing', 'seo', 'social media', 'content', 'advertising', 'campaign', 'email', 'analytics', 'conversion'],
      data_science: ['data science', 'analytics', 'statistics', 'visualization', 'pandas', 'numpy', 'analysis', 'jupyter', 'data analysis']
    };

    this.domainIcons = {
      frontend_development: '⚛️',
      backend_development: '💻',
      machine_learning: '🧠',
      ui_ux_design: '🎨',
      digital_marketing: '📈',
      data_science: '📊',
      custom: '🚀'
    };

    this.toolKeywords = {
      python: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'sklearn'],
      javascript: ['javascript', 'node', 'nodejs', 'express', 'typescript'],
      react: ['react', 'jsx', 'hooks', 'redux', 'next.js', 'vite'],
      vue: ['vue', 'nuxt', 'vuex', 'pinia'],
      css: ['css', 'tailwind', 'sass', 'scss', 'flexbox', 'grid'],
      data: ['sql', 'postgres', 'mysql', 'mongodb', 'analytics', 'dashboard'],
      ml: ['tensorflow', 'pytorch', 'huggingface', 'nlp', 'transformers', 'neural'],
      design: ['figma', 'wireframe', 'prototype', 'typography', 'color'],
      marketing: ['seo', 'email', 'content', 'ads', 'campaign', 'social']
    };
  }

  detectDomain(goalText) {
    const lowerGoal = goalText.toLowerCase();
    const scores = {};

    for (const [domainId, keywords] of Object.entries(this.domainKeywords)) {
      scores[domainId] = 0;
      for (const keyword of keywords) {
        if (lowerGoal.includes(keyword)) {
          scores[domainId] += keyword.includes(' ') ? 2 : 1;
        }
      }
    }

    let maxScore = 0;
    let selectedDomain = null;

    for (const [domainId, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        selectedDomain = domainId;
      }
    }

    // No domain matched — build a dynamic domain from the goal text
    if (maxScore === 0 || selectedDomain === null) {
      return 'dynamic';
    }

    return selectedDomain;
  }

  buildDynamicDomain(goalText, profile) {
    const lowerGoal = goalText.toLowerCase();

    // Extract the main subject from the goal
    const learnMatch = lowerGoal.match(
      /(?:learn|master|study|understand|explore|get into|practice|become good at)\s+(?:to\s+)?([a-z0-9#.+\s]+?)(?:\s+(?:from scratch|for beginners?|as a beginner|professionally|quickly|well|deeply|thoroughly))?(?:\s+and\s+.*)?$/
    );

    let subject = learnMatch?.[1]?.trim() || goalText;
    // Strip common filler words
    const stopwords = new Set(['i', 'want', 'to', 'the', 'a', 'an', 'and', 'or', 'how', 'make', 'create', 'write', 'use', 'with', 'be', 'do']);
    subject = subject
      .split(/\s+/)
      .filter((w) => !stopwords.has(w))
      .join(' ')
      .replace(/[^\w\s#.+]/g, '')
      .trim()
      .slice(0, 40);

    const subjectId = subject.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '');
    const subjectTitle = subject.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const level = profile?.learnerLevel || 'beginner';

    return {
      id: 'custom',
      name: subjectTitle,
      skills: [
        {
          id: `${subjectId}_foundations`,
          name: `${subjectTitle} Foundations`,
          description: `Core concepts and mental models to begin learning ${subjectTitle}.`,
          level: 'beginner',
          days: 3,
          topics: [
            `introduction to ${subject}`,
            'core concepts and terminology',
            'getting started and setup',
            'first hands-on example',
            'essential tools and resources'
          ]
        },
        {
          id: `${subjectId}_practical`,
          name: `Practical ${subjectTitle}`,
          description: `Apply ${subjectTitle} concepts through hands-on practice and real examples.`,
          level: level === 'advanced' ? 'intermediate' : level,
          days: 4,
          topics: [
            'practical techniques',
            'common patterns and workflows',
            'hands-on exercises',
            'solving real problems',
            'building small projects'
          ]
        },
        {
          id: `${subjectId}_advanced`,
          name: `Advanced ${subjectTitle}`,
          description: `Go deeper with advanced patterns, best practices, and professional-level ${subjectTitle}.`,
          level: 'advanced',
          days: 3,
          topics: [
            'advanced concepts',
            'best practices',
            'optimization techniques',
            'professional workflow',
            'portfolio project'
          ]
        }
      ]
    };
  }

  parseGoalProfile(goalText, domainId) {
    const lowerGoal = goalText.toLowerCase();
    const cleanedGoal = lowerGoal.replace(/[^a-z0-9\s/+.-]/g, ' ');
    const focusKeywords = [...new Set(cleanedGoal.split(/\s+/).filter((word) => word.length > 2))];
    const detectedTools = [];

    for (const [toolGroup, keywords] of Object.entries(this.toolKeywords)) {
      for (const keyword of keywords) {
        if (lowerGoal.includes(keyword)) {
          detectedTools.push(keyword);
        }
      }
      if (detectedTools.length >= 6) {
        break;
      }
    }

    const targetRole = this.extractTargetRole(lowerGoal, domainId);
    const learnerLevel = this.detectLearnerLevel(lowerGoal);
    const intensity = this.detectIntensity(lowerGoal);

    return {
      rawGoal: goalText,
      targetRole,
      learnerLevel,
      intensity,
      detectedTools: [...new Set(detectedTools)].slice(0, 6),
      focusKeywords,
      domainId
    };
  }

  extractTargetRole(lowerGoal, domainId) {
    const rolePatterns = [
      /become (?:a|an)?\s+([a-z0-9\s/+.-]+?)(?: developer| engineer| scientist| designer| marketer)?(?:$| with| in)/,
      /learn (?:to )?([a-z0-9\s/+.-]+?)(?:$| with| in)/,
      /master ([a-z0-9\s/+.-]+?)(?:$| with| in)/
    ];

    for (const pattern of rolePatterns) {
      const match = lowerGoal.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    const domainNames = {
      backend_development: 'backend developer',
      machine_learning: 'machine learning engineer',
      ui_ux_design: 'ui/ux designer',
      digital_marketing: 'digital marketer',
      data_science: 'data scientist'
    };

    return domainNames[domainId] || 'specialist';
  }

  detectLearnerLevel(lowerGoal) {
    if (/(beginner|from scratch|new to|no experience)/.test(lowerGoal)) {
      return 'beginner';
    }
    if (/(advanced|expert|master|deeper|production)/.test(lowerGoal)) {
      return 'advanced';
    }
    return 'intermediate';
  }

  detectIntensity(lowerGoal) {
    if (/(quickly|fast|urgent|asap|soon)/.test(lowerGoal)) {
      return 'accelerated';
    }
    if (/(thorough|deep|complete|mastery)/.test(lowerGoal)) {
      return 'deep';
    }
    return 'steady';
  }

  personalizeSkills(domain, profile) {
    const prioritizedSkills = domain.skills.map((skill, index) => {
      const searchableText = `${skill.name} ${skill.description} ${(skill.topics || []).join(' ')}`.toLowerCase();
      let relevanceScore = 0;

      for (const keyword of profile.focusKeywords) {
        if (searchableText.includes(keyword)) {
          relevanceScore += keyword.length > 5 ? 3 : 2;
        }
      }

      for (const tool of profile.detectedTools) {
        if (searchableText.includes(tool)) {
          relevanceScore += 4;
        }
      }

      if (profile.targetRole && searchableText.includes(profile.targetRole)) {
        relevanceScore += 5;
      }

      const personalizedTopics = this.personalizeTopics(skill.topics || [], profile);
      const personalizedDays = this.personalizeDays(skill.days, relevanceScore, profile.intensity);

      return {
        ...skill,
        topics: personalizedTopics,
        days: personalizedDays,
        relevanceScore,
        reason: this.buildSkillReason(skill, profile, relevanceScore),
        recommendedFor: profile.targetRole,
        sequenceHint: index + 1
      };
    });

    return prioritizedSkills.sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }
      return left.days - right.days;
    });
  }

  personalizeTopics(topics, profile) {
    const matched = topics.filter((topic) =>
      profile.focusKeywords.some((keyword) => topic.toLowerCase().includes(keyword))
        || profile.detectedTools.some((tool) => topic.toLowerCase().includes(tool))
    );
    const remaining = topics.filter((topic) => !matched.includes(topic));
    return [...matched, ...remaining];
  }

  personalizeDays(baseDays, relevanceScore, intensity) {
    let adjustedDays = baseDays;

    if (relevanceScore >= 8) adjustedDays += 1;
    if (relevanceScore >= 14) adjustedDays += 1;
    if (intensity === 'accelerated') adjustedDays = Math.max(1, adjustedDays - 1);
    if (intensity === 'deep') adjustedDays += 1;

    return adjustedDays;
  }

  buildSkillReason(skill, profile, relevanceScore) {
    if (relevanceScore <= 0) {
      return `Included as a foundation for becoming a ${profile.targetRole}.`;
    }

    const matchingTopic = (skill.topics || []).find((topic) =>
      profile.focusKeywords.some((keyword) => topic.toLowerCase().includes(keyword))
        || profile.detectedTools.some((tool) => topic.toLowerCase().includes(tool))
    );

    if (matchingTopic) {
      return `Prioritized because your goal mentions ${matchingTopic.toLowerCase()} and aligns with ${skill.name}.`;
    }

    return `Prioritized because ${skill.name} strongly supports your ${profile.targetRole} goal.`;
  }

  decompose(goalText) {
    const domainId = this.detectDomain(goalText);

    if (domainId === 'dynamic') {
      const profile = this.parseGoalProfile(goalText, 'custom');
      const dynamicDomain = this.buildDynamicDomain(goalText, profile);
      const skills = this.personalizeSkills(dynamicDomain, profile);
      return {
        domain: 'custom',
        domainName: dynamicDomain.name,
        profile,
        skills
      };
    }

    const domain = this.domains[domainId];
    if (!domain) {
      throw new Error(`Domain not found: ${domainId}`);
    }

    const profile = this.parseGoalProfile(goalText, domainId);
    const skills = this.personalizeSkills(domain, profile);

    return {
      domain: domainId,
      domainName: domain.name,
      profile,
      skills
    };
  }

  getDomainIcon(domainId) {
    return this.domainIcons[domainId] || '🚀';
  }
}

export default SkillDecomposer;
