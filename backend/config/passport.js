const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Serialize / Deserialize
passport.serializeUser((user, done) => {
  if (!user || !user._id) return done(new Error('Invalid user object in serializeUser'));
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password -emailVerifyToken -passwordResetToken');
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      if (!email || !password) {
        return done(null, false, { message: 'Email and password are required' });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return done(null, false, { message: 'No account found with that email' });
      if (!user.password) return done(null, false, { message: 'This account uses Google or GitHub login. Please use OAuth.' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Incorrect password' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(null, false, { message: 'No email from Google account' });

      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
          await user.save();
        } else {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName || 'User',
            email,
            avatar: profile.photos?.[0]?.value,
            role: 'student',
            isEmailVerified: true
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback',
    scope: ['user:email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.users.noreply.com`;

      let user = await User.findOne({ githubId: profile.id });
      if (!user) {
        user = await User.findOne({ email });
        if (user) {
          user.githubId = profile.id;
          await user.save();
        } else {
          user = await User.create({
            githubId: profile.id,
            name: profile.displayName || profile.username || 'GitHub User',
            email,
            github: profile.profileUrl,
            avatar: profile.photos?.[0]?.value,
            role: 'student',
            isEmailVerified: true
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}
