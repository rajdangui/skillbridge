const Opportunity = require('../models/Opportunity');
const User = require('../models/User');

const SKILL_ALIASES = {
  'javascript': ['js', 'es6', 'es2015', 'ecmascript', 'vanilla js'],
  'typescript': ['ts'],
  'react': ['reactjs', 'react.js'],
  'node': ['nodejs', 'node.js', 'express', 'expressjs'],
  'python': ['py'],
  'postgresql': ['postgres', 'psql', 'sql'],
  'mongodb': ['mongo'],
  'kubernetes': ['k8s'],
  'css': ['scss', 'sass', 'tailwind', 'tailwindcss', 'styled-components'],
  'graphql': ['gql'],
  'docker': ['containerization', 'containers'],
  'git': ['github', 'gitlab', 'version control'],
  'machine learning': ['ml', 'deep learning', 'ai', 'artificial intelligence'],
  'react native': ['rn', 'mobile react'],
  'java': ['spring', 'spring boot', 'jvm'],
  'c++': ['cpp', 'c plus plus'],
};

const ADVANCED_SKILLS  = ['kubernetes','graphql','system design','microservices','terraform','rust','go','kafka','elasticsearch'];
const INTERMEDIATE_SKILLS = ['docker','redis','postgresql','mongodb','typescript','next.js','fastapi','django','spring boot'];

function normalizeSkill(skill) {
  return skill.toLowerCase().trim();
}

function skillsMatch(userSkill, requiredSkill) {
  const u = normalizeSkill(userSkill);
  const r = normalizeSkill(requiredSkill);
  if (u === r) return true;
  if (u.includes(r) || r.includes(u)) return true;
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    const allForms = [canonical, ...aliases];
    if (allForms.includes(u) && allForms.includes(r)) return true;
  }
  return false;
}

function getSkillDifficulty(skill) {
  const s = normalizeSkill(skill);
  if (ADVANCED_SKILLS.some(a => s.includes(a) || a.includes(s))) return 'advanced';
  if (INTERMEDIATE_SKILLS.some(a => s.includes(a) || a.includes(s))) return 'intermediate';
  return 'beginner';
}

function estimateLearningTime(difficulty) {
  return { beginner: '3–6 hours', intermediate: '8–15 hours', advanced: '20–40 hours' }[difficulty];
}

exports.analyzeSkillGap = async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const [student, opportunity] = await Promise.all([
      User.findById(req.user._id).select('name skills'),
      Opportunity.findById(opportunityId).select('title company requiredSkills description')
    ]);

    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    const studentSkills = student.skills || [];
    const requiredSkills = opportunity.requiredSkills || [];

    if (requiredSkills.length === 0) {
      return res.json({ matchScore: 100, matchedSkills: [], missingSkills: [], partialMatches: [], totalRequired: 0, message: 'No specific skills listed' });
    }

    // Returns PLAIN STRINGS for frontend compatibility
    const matchedSkills = [];
    const missingSkills = [];
    const partialMatches = [];

    requiredSkills.forEach(req => {
      const exactMatch = studentSkills.find(us => skillsMatch(us, req));
      if (exactMatch) {
        matchedSkills.push(req); // plain string — the required skill name
      } else {
        const partial = studentSkills.find(us => {
          const u = normalizeSkill(us);
          const r = normalizeSkill(req);
          return u.split(' ').some(word => r.includes(word) && word.length > 2) ||
                 r.split(' ').some(word => u.includes(word) && word.length > 2);
        });
        if (partial) {
          partialMatches.push(req); // plain string
        } else {
          missingSkills.push(req); // plain string
        }
      }
    });

    const score = Math.round(
      ((matchedSkills.length + partialMatches.length * 0.5) / requiredSkills.length) * 100
    );

    // Also include rich metadata for future use
    const missingWithMeta = missingSkills.map(skill => ({
      skill,
      difficulty: getSkillDifficulty(skill),
      estimatedTime: estimateLearningTime(getSkillDifficulty(skill)),
      priority: getSkillDifficulty(skill) === 'beginner' ? 'high' : getSkillDifficulty(skill) === 'intermediate' ? 'medium' : 'low'
    }));

    res.json({
      matchScore: score,
      matchedSkills,    // string[]
      missingSkills,    // string[] — plain names for rendering + learning links
      partialMatches,   // string[]
      missingWithMeta,  // rich objects if needed
      totalRequired: requiredSkills.length,
      totalMatched: matchedSkills.length,
      totalPartial: partialMatches.length,
      totalMissing: missingSkills.length,
      opportunity: { title: opportunity.title, company: opportunity.company },
      verdict: score >= 80 ? 'strong' : score >= 50 ? 'moderate' : 'weak'
    });

  } catch (err) {
    console.error('Skill gap analysis error:', err);
    res.status(500).json({ message: 'Failed to analyze skill gap' });
  }
};

exports.batchAnalyze = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('skills');
    const opportunities = await Opportunity.find({ isActive: true })
      .select('title company requiredSkills type')
      .limit(20)
      .sort({ createdAt: -1 });

    const results = opportunities.map(opp => {
      const required = opp.requiredSkills || [];
      if (required.length === 0) return { opportunityId: opp._id, title: opp.title, company: opp.company, type: opp.type, matchScore: 100 };
      const matched = required.filter(r => (student.skills || []).some(us => skillsMatch(us, r))).length;
      return { opportunityId: opp._id, title: opp.title, company: opp.company, type: opp.type, matchScore: Math.round((matched / required.length) * 100), requiredCount: required.length, matchedCount: matched };
    });

    results.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ results: results.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ message: 'Batch analysis failed' });
  }
};
