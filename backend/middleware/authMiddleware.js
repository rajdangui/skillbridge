exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Not authenticated. Please sign in.' });
};

exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access required.' });
};

exports.isCompany = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && (req.user?.role === 'company' || req.user?.role === 'admin')) return next();
  res.status(403).json({ message: 'Company account required.' });
};

exports.isStudent = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && (req.user?.role === 'student' || req.user?.role === 'admin')) return next();
  res.status(403).json({ message: 'Student account required.' });
};
