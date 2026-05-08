const axios = require('axios');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');

const TONE_INSTRUCTIONS = {
  professional: 'formal, confident, and polished — suitable for large established companies',
  enthusiastic: 'energetic, passionate, and excited — conveys genuine excitement about the role',
  concise:      'brief, direct, and punchy — under 200 words, no fluff whatsoever',
  creative:     'unique, personality-forward, and memorable — stands out from generic applications'
};

exports.generateCoverLetter = async (req, res) => {
  try {
    const { opportunityId, tone = 'professional', extraNotes = '' } = req.body;

    if (!opportunityId) return res.status(400).json({ message: 'Opportunity ID is required' });

    const [student, opportunity] = await Promise.all([
      User.findById(req.user._id).select('name bio college branch skills github linkedin'),
      Opportunity.findById(opportunityId).select('title company description requiredSkills location type')
    ]);

    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });

    const prompt = `You are an expert career coach writing a cover letter for a student.

STUDENT PROFILE:
- Name: ${student.name}
- College: ${student.college || 'Not specified'}
- Branch/Major: ${student.branch || 'Not specified'}  
- Skills: ${(student.skills || []).join(', ') || 'Not specified'}
- Bio: ${student.bio || 'Not specified'}
${student.github ? `- GitHub: ${student.github}` : ''}
${student.linkedin ? `- LinkedIn: ${student.linkedin}` : ''}

JOB OPPORTUNITY:
- Title: ${opportunity.title}
- Company: ${opportunity.company}
- Type: ${opportunity.type}
- Location: ${opportunity.location || 'Not specified'}
- Required Skills: ${(opportunity.requiredSkills || []).join(', ') || 'Not specified'}
- Description: ${opportunity.description?.slice(0, 500) || 'Not specified'}

TONE: ${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional}

RULES:
- 3–4 paragraphs, under 350 words (under 200 if concise tone)
- Address to "Hiring Team at ${opportunity.company}"
- Sign off with student name
- Highlight overlapping skills naturally — never list them robotically
- NO placeholder text like [Your Address] or [Date]
- NO clichés: "I am writing to express", "I believe I would be a great fit", "passionate about"
- Start with a strong hook — not "My name is" or "I am a student"
${extraNotes ? `- ADDITIONAL INSTRUCTIONS: ${extraNotes}` : ''}

Write ONLY the cover letter. Nothing before or after it.`;

    let coverLetter = '';
    const usingGemini = !!process.env.GEMINI_API_KEY;
    const usingOpenAI = !!process.env.OPENAI_API_KEY;

    if (usingGemini) {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024 }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      });
      coverLetter = response.data.candidates[0]?.content?.parts[0]?.text || '';

    } else if (usingOpenAI) {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 30000
      });
      coverLetter = response.data.choices[0].message.content;

    } else {
      coverLetter = generateDemoCoverLetter(student, opportunity, tone);
    }

    res.json({
      coverLetter: coverLetter.trim(),
      studentName: student.name,
      opportunityTitle: opportunity.title,
      company: opportunity.company,
      tone,
      demo: !usingGemini && !usingOpenAI
    });

  } catch (err) {
    console.error('Cover letter error:', err.response?.data || err.message);
    if (err.response?.status === 429) return res.status(429).json({ message: 'AI rate limit hit. Please try again in a moment.' });
    if (err.code === 'ECONNABORTED') return res.status(504).json({ message: 'AI request timed out. Please try again.' });
    res.status(500).json({ message: 'Failed to generate cover letter' });
  }
};

function generateDemoCoverLetter(student, opportunity, tone) {
  const skills = (student.skills || []).slice(0, 3).join(', ') || 'software development';
  const name = student.name;
  const college = student.college || 'university';
  const branch = student.branch || 'Computer Science';
  const company = opportunity.company;
  const title = opportunity.title;

  const openers = {
    professional: `The ${title} role at ${company} stood out immediately — not because it checked boxes, but because it aligns precisely with the work I have been building toward.`,
    enthusiastic: `Building with ${(opportunity.requiredSkills || [])[0] || 'modern tech'} and shipping real products is exactly what gets me out of bed — which is why the ${title} opening at ${company} felt written for me.`,
    concise: `${name} — ${branch} student, ${college}. Applying for ${title} at ${company}.`,
    creative: `Most cover letters start with "I am excited to apply." Mine starts with a confession: I have been following ${company}'s work for months, quietly hoping this opening would appear.`
  };

  if (tone === 'concise') {
    return `${openers.concise}\n\nCore skills: ${skills}. Strong fundamentals in ${branch}. Ready to contribute from day one.\n\nI do my best work in fast-paced teams where ownership matters. ${opportunity.type === 'internship' ? 'Looking for hands-on experience — not busywork.' : 'Looking to make an immediate impact.'}\n\nAvailable for a quick call anytime.\n\n— ${name}`;
  }

  return `Dear Hiring Team at ${company},

${openers[tone] || openers.professional}

My background in ${branch} at ${college} has given me strong foundations in ${skills}. More importantly, I have moved beyond coursework — building projects that solve real problems, reading production code, and developing the instinct to know when something is good enough and when it needs another pass.

${opportunity.type === 'internship'
  ? `An internship at ${company} would let me contribute meaningfully while learning from engineers who have already solved the problems I am just starting to encounter. I am not looking to shadow — I am looking to build.`
  : `What draws me to ${company} specifically is the scale and thoughtfulness of what your team ships. I want to be part of a team where quality is taken seriously and velocity is earned, not assumed.`}

I would welcome a conversation about how I can contribute. Thank you for your time.

Sincerely,
${name}`;
}
