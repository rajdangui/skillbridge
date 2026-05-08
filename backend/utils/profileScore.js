/**
 * Compute profile completeness score 0–100.
 * Used in the profile strength meter + feature gating.
 * Role-aware: uses different criteria for students vs companies.
 */
function computeProfileScore(user) {
  if (!user) return 0;

  if (user.role === 'company') {
    const checks = [
      // Core — 60 pts
      { pts: 20, ok: !!user.bio && user.bio.length >= 30 },
      { pts: 20, ok: !!user.companyName },
      { pts: 20, ok: !!user.companyWebsite },
      // Presence — 30 pts
      { pts: 15, ok: !!user.linkedin },
      { pts: 10, ok: !!user.avatar },
      // Extras — 10 pts
      { pts:  5, ok: !!user.website },
      { pts:  5, ok: user.isEmailVerified === true },
    ];
    // Cap at 100
    return Math.min(100, checks.filter(c => c.ok).reduce((sum, c) => sum + c.pts, 0));
  }

  // Student scoring (unchanged)
  const checks = [
    // Core — 60 pts
    { pts: 15, ok: !!user.bio && user.bio.length >= 30 },
    { pts: 15, ok: Array.isArray(user.skills) && user.skills.length >= 3 },
    { pts: 10, ok: !!user.college },
    { pts: 10, ok: !!user.branch },
    { pts:  5, ok: !!user.github },
    { pts:  5, ok: !!user.linkedin },
    // Career — 25 pts
    { pts: 15, ok: !!user.resume },
    { pts: 10, ok: Array.isArray(user.projects) && user.projects.length >= 1 },
    // Extras — 15 pts
    { pts:  5, ok: !!user.website || !!user.portfolio },
    { pts:  5, ok: !!user.avatar },
    { pts:  5, ok: user.isEmailVerified === true },
  ];
  return checks.filter(c => c.ok).reduce((sum, c) => sum + c.pts, 0);
}

/**
 * Returns a message for each milestone.
 */
function scoreLabel(score) {
  if (score >= 90) return { label: 'Elite',    color: '#34D399' };
  if (score >= 70) return { label: 'Strong',   color: '#34D399' };
  if (score >= 50) return { label: 'Good',     color: '#FBBF24' };
  if (score >= 30) return { label: 'Building', color: '#FBBF24' };
  return               { label: 'Starter',  color: '#F87171' };
}

/**
 * List of incomplete items with point value — used in the UI nudge list.
 * Role-aware: returns company-appropriate hints for company users.
 */
function missingItems(user) {
  if (user?.role === 'company') {
    const items = [];
    if (!user.bio || user.bio.length < 30)      items.push({ pts:20, msg:'Add a company description (30+ chars)', link:'/profile/edit' });
    if (!user.companyName)                       items.push({ pts:20, msg:'Set your company name',                 link:'/profile/edit' });
    if (!user.companyWebsite)                    items.push({ pts:20, msg:'Add your company website',              link:'/profile/edit' });
    if (!user.linkedin)                          items.push({ pts:15, msg:'Add your LinkedIn page',               link:'/profile/edit' });
    if (!user.avatar)                            items.push({ pts:10, msg:'Upload a company logo',                link:'/profile/edit' });
    if (!user.website)                           items.push({ pts: 5, msg:'Add a secondary website',              link:'/profile/edit' });
    if (!user.isEmailVerified)                   items.push({ pts: 5, msg:'Verify your email',                    link:'/settings' });
    return items.sort((a,b) => b.pts - a.pts).slice(0,5);
  }

  // Student missing items (unchanged)
  const items = [];
  if (!user.bio || user.bio.length < 30)      items.push({ pts:15, msg:'Add a bio (30+ chars)',         link:'/profile/edit' });
  if (!user.skills?.length || user.skills.length < 3) items.push({ pts:15, msg:'Add at least 3 skills', link:'/profile/edit' });
  if (!user.college)                           items.push({ pts:10, msg:'Add your college',              link:'/profile/edit' });
  if (!user.branch)                            items.push({ pts:10, msg:'Add your branch',               link:'/profile/edit' });
  if (!user.resume)                            items.push({ pts:15, msg:'Upload or build your resume',   link:'/resume-builder' });
  if (!user.projects?.length)                  items.push({ pts:10, msg:'Add a project',                 link:'/profile/edit' });
  if (!user.github)                            items.push({ pts: 5, msg:'Add GitHub profile',            link:'/profile/edit' });
  if (!user.linkedin)                          items.push({ pts: 5, msg:'Add LinkedIn profile',          link:'/profile/edit' });
  if (!user.website && !user.portfolio)        items.push({ pts: 5, msg:'Add portfolio/website',         link:'/profile/edit' });
  if (!user.isEmailVerified)                   items.push({ pts: 5, msg:'Verify your email',             link:'/settings' });
  return items.sort((a,b) => b.pts - a.pts).slice(0,5);
}

module.exports = { computeProfileScore, scoreLabel, missingItems };
