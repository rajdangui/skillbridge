const axios = require('axios');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const AcademicProfile = require('../models/AcademicProfile');

// ── BUILD SYSTEM PROMPT WITH USER CONTEXT ──────────────────────────────────
async function buildSystemPrompt(userId) {
  try {
    const [user, apps, academic] = await Promise.all([
      User.findById(userId).select('name college branch skills bio github linkedin role').lean(),
      Application.find({ studentId: userId }).populate('opportunityId', 'title company type').limit(10).lean(),
      AcademicProfile.findOne({ userId }).select('cgpa currentSem institution degree branch semesters assignments exams attendance').lean(),
    ]);

    const appSummary = apps.map(a =>
      `  - ${a.opportunityId?.title || 'Unknown'} at ${a.opportunityId?.company || 'Unknown'} [${a.status}]`
    ).join('\n') || '  None yet';

    const pendingAssignments = (academic?.assignments || [])
      .filter(a => a.status === 'pending' || a.status === 'overdue')
      .slice(0, 5)
      .map(a => `  - ${a.title} (${a.subject}) — due ${new Date(a.dueDate).toLocaleDateString()}, ${a.status}`)
      .join('\n') || '  None';

    const upcomingExams = (academic?.exams || [])
      .filter(e => e.status === 'upcoming')
      .slice(0, 5)
      .map(e => `  - ${e.title} (${e.subject}) — ${new Date(e.date).toLocaleDateString()}`)
      .join('\n') || '  None';

    const lowAttendance = (academic?.attendance || [])
      .filter(a => a.total > 0 && (a.present / a.total) * 100 < (a.minRequired || 75))
      .map(a => `  - ${a.subject}: ${Math.round(a.present/a.total*100)}% (min ${a.minRequired || 75}%)`)
      .join('\n') || '  None';

    return `You are SkillBridge AI — a smart, friendly career and academic assistant built into SkillBridge, a job portal for Indian college students.

## WHO YOU ARE
- You help students with career guidance, job applications, skill development, interview prep, and academic management
- You are concise, practical, and encouraging — never preachy or overly formal
- You know the Indian college ecosystem (B.Tech, MCA, placement seasons, backlogs, CGPA cutoffs)
- You can reference the student's real data (shown below) to give personalised advice

## STUDENT PROFILE
- Name: ${user?.name || 'Student'}
- College: ${user?.college || 'Not specified'}
- Branch: ${user?.branch || 'Not specified'}
- Skills: ${(user?.skills || []).join(', ') || 'Not added yet'}
- Bio: ${user?.bio || 'Not set'}
${user?.github ? `- GitHub: ${user.github}` : ''}
${user?.linkedin ? `- LinkedIn: ${user.linkedin}` : ''}

## ACADEMIC SUMMARY
- Degree: ${academic?.degree || user?.branch || 'Not specified'}
- Institution: ${academic?.institution || user?.college || 'Not specified'}
- Current Semester: ${academic?.currentSem || 'Unknown'}
- CGPA: ${academic?.cgpa || 'Not recorded'}
- Pending Assignments:\n${pendingAssignments}
- Upcoming Exams:\n${upcomingExams}
- Low Attendance Subjects:\n${lowAttendance}

## JOB APPLICATIONS (last 10)
${appSummary}

## CAPABILITIES YOU CAN HELP WITH
1. Career — resume tips, interview prep, which roles to apply, salary expectations, career paths
2. Skills — what to learn next, roadmaps, comparing technologies, project ideas
3. Applications — cover letter advice, why you might be rejected, how to follow up
4. Academic — study strategies, CGPA improvement, attendance management, exam prep
5. Platform — how to use SkillBridge features (cover letter generator, skill gap analyzer, ATS checker, college dashboard)
6. General CS — explain concepts, debug logic, code review

## TONE & FORMAT
- Be direct. 2–4 sentences for simple questions, structured lists for complex ones
- Use markdown: **bold** for key terms, bullet lists for steps, \`code\` for technical terms
- If asked about something outside your scope, say so briefly and redirect
- Never make up job listings, company names, or salary figures you don't know
- Today's date: ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}`;

  } catch (err) {
    console.warn('Context build error:', err.message);
    return `You are SkillBridge AI — a helpful career and academic assistant for Indian college students. Be concise, practical, and encouraging. Today: ${new Date().toLocaleDateString()}`;
  }
}

// ── DEMO RESPONSES (no API key) ────────────────────────────────────────────
const DEMO_RESPONSES = [
  "I'm running in demo mode — add `MISTRAL_API_KEY` to your `.env` file to enable full AI responses.\n\nIn the meantime, try the **Skill Gap Analyzer** or **Cover Letter Generator** from your dashboard!",
  "To get real Mistral AI responses, add your Mistral API key to `backend/.env`:\n```\nMISTRAL_API_KEY=your_key_here\n```\nGet a key at [console.mistral.ai](https://console.mistral.ai)",
  "**Demo mode active.** I can't answer questions without a Mistral API key, but here's a tip: make sure your profile has your skills filled in — it improves all AI features on SkillBridge.",
];
let demoIdx = 0;

// ── MAIN CHAT HANDLER ──────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array required' });
    }

    // Validate message structure, strip any injected system roles
    const safeMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) }))
      .slice(-20); // keep last 20 messages max

    if (safeMessages.length === 0) {
      return res.status(400).json({ message: 'No valid messages' });
    }

    // Demo fallback
    if (!process.env.MISTRAL_API_KEY) {
      await new Promise(r => setTimeout(r, 600)); // simulate latency
      return res.json({
        reply: DEMO_RESPONSES[demoIdx++ % DEMO_RESPONSES.length],
        demo: true,
      });
    }

    // Build personalised system prompt
    const systemPrompt = await buildSystemPrompt(req.user._id);

    // Map messages for Mistral (system role at front)
    const mistralMessages = [
      { role: 'system', content: systemPrompt },
      ...safeMessages
    ];

    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
      messages: mistralMessages,
      max_tokens: 1024,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000,
    });

    const reply = response.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({ reply, demo: false });

  } catch (err) {
    console.error('Chat error:', err.response?.data || err.message);
    if (err.response?.status === 429) {
      return res.status(429).json({ message: 'Rate limit hit. Please wait a moment before sending another message.' });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'Request timed out. Please try again.' });
    }
    res.status(500).json({ message: 'Chat service unavailable. Please try again.' });
  }
};
