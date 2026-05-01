import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import GeminiService from '../services/GeminiService.js';

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

    if (maxScore === 0 || selectedDomain === null) return 'dynamic';
    return selectedDomain;
  }

  // ── Gemini-powered universal decomposition ─────────────────────────────────
  async decomposeWithLLM(goalText) {
    const prompt = `You are an expert learning architect. A user wants to: "${goalText}"

Analyze this goal and return a complete skill tree as JSON. This must work for ANY domain on earth — tailoring, cooking, music, law, medicine, martial arts, agriculture, languages, sports, etc.

Return ONLY valid JSON with this exact structure:
{
  "domain": "snake_case_domain_id",
  "domainLabel": "Human Readable Domain Name",
  "domainIcon": "single relevant emoji",
  "profile": {
    "targetRole": "what they want to become",
    "learnerLevel": "beginner|intermediate|advanced",
    "intensity": "accelerated|balanced|deep",
    "detectedTools": ["tool1", "tool2"],
    "focusKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  "skills": [
    {
      "id": "snake_case_skill_id",
      "name": "Skill Display Name",
      "description": "What this skill covers and why it matters",
      "level": "beginner|intermediate|advanced",
      "days": 4,
      "topics": ["specific topic 1", "specific topic 2", "specific topic 3", "specific topic 4", "specific topic 5"],
      "reason": "Why this skill is critical for their goal"
    }
  ],
  "totalEstimatedDays": 35
}

Rules:
- 4 to 6 skills, ordered foundational → advanced
- Skills must be 100% specific to the domain (no generic "foundations" — name the real skills)
- Topics must be real, domain-specific concepts (e.g. for tailoring: "seam allowance", "bias cut", not "core concepts")
- days: 3 to 10 per skill
- totalEstimatedDays: sum of all skill days
- learnerLevel: infer from goal text (words like "beginner", "from scratch" → beginner)
- detectedTools: real tools/materials used in that domain`;

    try {
      const result = await GeminiService.generateJSON(prompt,
        'You are an expert curriculum designer. Return only valid JSON. Be specific to the exact domain — not generic.');

      if (result && result.skills && result.skills.length >= 3) {
        console.log(`[SkillDecomposer] Gemini decomposed "${goalText}" → ${result.domainLabel} (${result.skills.length} skills)`);
        return result;
      }
    } catch (err) {
      console.error('[SkillDecomposer] Gemini error:', err.message);
    }
    return null;
  }

  buildDynamicDomain(goalText, profile) {
    const lowerGoal = goalText.toLowerCase();
    const learnMatch = lowerGoal.match(
      /(?:learn|master|study|understand|explore|get into|practice|become good at|become a|become an)\s+(?:to\s+)?([a-z0-9#.+\s]+?)(?:\s+(?:from scratch|for beginners?|as a beginner|professionally|quickly|well|deeply))?(?:\s+and\s+.*)?$/
    );

    let subject = learnMatch?.[1]?.trim() || goalText;
    const stopwords = new Set(['i', 'want', 'to', 'the', 'a', 'an', 'and', 'or', 'how', 'make', 'create', 'write', 'use', 'with', 'be', 'do']);
    subject = subject.split(/\s+/).filter(w => !stopwords.has(w)).join(' ')
      .replace(/[^\w\s#.+]/g, '').trim().slice(0, 40);

    const subjectId = subject.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '');
    const subjectTitle = subject.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const level = profile?.learnerLevel || 'beginner';

    return {
      id: 'custom',
      name: subjectTitle,
      skills: [
        {
          id: `${subjectId}_foundations`,
          name: `${subjectTitle} Foundations`,
          description: `Core concepts and mental models to begin learning ${subjectTitle}.`,
          level: 'beginner', days: 4,
          topics: [`introduction to ${subject}`, 'core concepts', 'essential tools', 'first hands-on example', 'common terminology']
        },
        {
          id: `${subjectId}_practical`,
          name: `Practical ${subjectTitle}`,
          description: `Apply ${subjectTitle} through hands-on practice.`,
          level: level === 'advanced' ? 'intermediate' : level, days: 5,
          topics: ['practical techniques', 'common patterns', 'hands-on exercises', 'solving real problems', 'building projects']
        },
        {
          id: `${subjectId}_intermediate`,
          name: `Intermediate ${subjectTitle}`,
          description: `Go deeper with intermediate patterns and workflows.`,
          level: 'intermediate', days: 4,
          topics: ['intermediate concepts', 'workflow optimization', 'common challenges', 'quality improvement', 'real-world scenarios']
        },
        {
          id: `${subjectId}_advanced`,
          name: `Advanced ${subjectTitle}`,
          description: `Professional-level ${subjectTitle} techniques and best practices.`,
          level: 'advanced', days: 4,
          topics: ['advanced concepts', 'best practices', 'professional workflow', 'portfolio project', 'mastery techniques']
        }
      ]
    };
  }

  parseGoalProfile(goalText, domainId) {
    const lowerGoal = goalText.toLowerCase();
    const cleanedGoal = lowerGoal.replace(/[^a-z0-9\s/+.-]/g, ' ');
    const focusKeywords = [...new Set(cleanedGoal.split(/\s+/).filter(w => w.length > 2))];
    const detectedTools = [];

    for (const [, keywords] of Object.entries(this.toolKeywords)) {
      for (const keyword of keywords) {
        if (lowerGoal.includes(keyword)) detectedTools.push(keyword);
      }
      if (detectedTools.length >= 6) break;
    }

    return {
      rawGoal: goalText,
      targetRole: this.extractTargetRole(lowerGoal, domainId),
      learnerLevel: this.detectLearnerLevel(lowerGoal),
      intensity: this.detectIntensity(lowerGoal),
      detectedTools: [...new Set(detectedTools)].slice(0, 6),
      focusKeywords,
      domainId
    };
  }

  extractTargetRole(lowerGoal, domainId) {
    const rolePatterns = [
      /become (?:a|an)?\s+([a-z0-9\s/+.-]+?)(?: developer| engineer| scientist| designer| marketer| tailor| chef| musician)?(?:$| with| in)/,
      /learn (?:to )?([a-z0-9\s/+.-]+?)(?:$| with| in)/,
      /master ([a-z0-9\s/+.-]+?)(?:$| with| in)/
    ];
    for (const pattern of rolePatterns) {
      const match = lowerGoal.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    const domainNames = {
      backend_development: 'backend developer', machine_learning: 'ML engineer',
      ui_ux_design: 'UX designer', digital_marketing: 'digital marketer', data_science: 'data scientist'
    };
    return domainNames[domainId] || 'specialist';
  }

  detectLearnerLevel(lowerGoal) {
    if (/(beginner|from scratch|new to|no experience|never|just starting)/.test(lowerGoal)) return 'beginner';
    if (/(advanced|expert|master|deeper|production|professional)/.test(lowerGoal)) return 'advanced';
    return 'intermediate';
  }

  detectIntensity(lowerGoal) {
    if (/(quickly|fast|urgent|asap|soon|rapid)/.test(lowerGoal)) return 'accelerated';
    if (/(thorough|deep|complete|mastery|comprehensive)/.test(lowerGoal)) return 'deep';
    return 'balanced';
  }

  personalizeSkills(domain, profile) {
    const prioritized = domain.skills.map((skill, index) => {
      const searchText = `${skill.name} ${skill.description} ${(skill.topics || []).join(' ')}`.toLowerCase();
      let relevanceScore = 0;
      for (const kw of profile.focusKeywords) {
        if (searchText.includes(kw)) relevanceScore += kw.length > 5 ? 3 : 2;
      }
      for (const tool of profile.detectedTools) {
        if (searchText.includes(tool)) relevanceScore += 4;
      }
      if (profile.targetRole && searchText.includes(profile.targetRole)) relevanceScore += 5;

      return {
        ...skill,
        topics: this.personalizeTopics(skill.topics || [], profile),
        days: this.personalizeDays(skill.days, relevanceScore, profile.intensity),
        relevanceScore,
        reason: this.buildSkillReason(skill, profile, relevanceScore),
        recommendedFor: profile.targetRole,
        sequenceHint: index + 1
      };
    });

    return prioritized.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return a.days - b.days;
    });
  }

  personalizeTopics(topics, profile) {
    const matched = topics.filter(t =>
      profile.focusKeywords.some(kw => t.toLowerCase().includes(kw)) ||
      profile.detectedTools.some(tool => t.toLowerCase().includes(tool))
    );
    const remaining = topics.filter(t => !matched.includes(t));
    return [...matched, ...remaining];
  }

  personalizeDays(baseDays, relevanceScore, intensity) {
    let days = baseDays;
    if (relevanceScore >= 8) days += 1;
    if (relevanceScore >= 14) days += 1;
    if (intensity === 'accelerated') days = Math.max(1, days - 1);
    if (intensity === 'deep') days += 1;
    return days;
  }

  buildSkillReason(skill, profile, relevanceScore) {
    if (relevanceScore <= 0) return `Foundation for becoming a ${profile.targetRole}.`;
    const matchingTopic = (skill.topics || []).find(t =>
      profile.focusKeywords.some(kw => t.toLowerCase().includes(kw)) ||
      profile.detectedTools.some(tool => t.toLowerCase().includes(tool))
    );
    if (matchingTopic) return `Prioritized because your goal mentions "${matchingTopic}" and directly aligns with ${skill.name}.`;
    return `Critical skill for your ${profile.targetRole} goal.`;
  }

  // ── Main entry point — tries Gemini first, falls back to rule-based ────────
  async decompose(goalText) {
    // Try Gemini first (handles ANY domain on earth)
    if (GeminiService.isEnabled()) {
      const llmResult = await this.decomposeWithLLM(goalText);
      if (llmResult) {
        const profile = {
          rawGoal: goalText,
          targetRole: llmResult.profile?.targetRole || 'specialist',
          learnerLevel: llmResult.profile?.learnerLevel || 'intermediate',
          intensity: llmResult.profile?.intensity || 'balanced',
          detectedTools: llmResult.profile?.detectedTools || [],
          focusKeywords: llmResult.profile?.focusKeywords || [],
          domainId: llmResult.domain
        };
        const skills = (llmResult.skills || []).map((s, i) => ({
          ...s,
          reason: s.reason || `Core skill for ${llmResult.domainLabel}`,
          sequenceHint: i + 1,
          relevanceScore: 10 - i
        }));
        return {
          domain: llmResult.domain || 'custom',
          domainName: llmResult.domainLabel || llmResult.domain,
          domainIcon: llmResult.domainIcon || '🚀',
          profile,
          skills
        };
      }
    }

    // Rule-based fallback
    const domainId = this.detectDomain(goalText);

    if (domainId === 'dynamic') {
      const profile = this.parseGoalProfile(goalText, 'custom');
      const dynamicDomain = this.buildDynamicDomain(goalText, profile);
      return {
        domain: 'custom',
        domainName: dynamicDomain.name,
        domainIcon: '🚀',
        profile,
        skills: this.personalizeSkills(dynamicDomain, profile)
      };
    }

    const domain = this.domains[domainId];
    if (!domain) throw new Error(`Domain not found: ${domainId}`);

    const profile = this.parseGoalProfile(goalText, domainId);
    return {
      domain: domainId,
      domainName: domain.name,
      domainIcon: this.domainIcons[domainId] || '🚀',
      profile,
      skills: this.personalizeSkills(domain, profile)
    };
  }

  getDomainIcon(domainId) {
    return this.domainIcons[domainId] || '🚀';
  }
}

export default SkillDecomposer;
