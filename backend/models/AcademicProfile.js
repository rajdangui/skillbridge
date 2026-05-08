const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, trim: true },
  credits:     { type: Number, min: 0, max: 10, default: 3 },
  grade:       { type: String, trim: true },   // A+, A, B+ etc
  gradePoints: { type: Number, min: 0, max: 10 },
  marks:       { type: Number, min: 0 },
  maxMarks:    { type: Number, default: 100 },
  type:        { type: String, enum: ['theory', 'practical', 'project', 'elective'], default: 'theory' },
}, { _id: true });

const semesterSchema = new mongoose.Schema({
  number:    { type: Number, required: true, min: 1, max: 12 },
  label:     { type: String, trim: true },  // e.g. "Sem 3 (2023)"
  sgpa:      { type: Number, min: 0, max: 10 },
  subjects:  { type: [subjectSchema], default: [] },
  isActive:  { type: Boolean, default: false },
  marksheetUrl: { type: String, default: null },
}, { _id: true });

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  subject:     { type: String, required: true, trim: true },
  dueDate:     { type: Date, required: true },
  status:      { type: String, enum: ['pending', 'submitted', 'overdue', 'graded'], default: 'pending' },
  marks:       { type: Number },
  maxMarks:    { type: Number, default: 100 },
  notes:       { type: String, trim: true, maxlength: 500 },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

const examSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  subject:     { type: String, required: true, trim: true },
  date:        { type: Date, required: true },
  time:        { type: String, trim: true },   // "10:00 AM"
  venue:       { type: String, trim: true },
  type:        { type: String, enum: ['midterm', 'endterm', 'unit-test', 'practical', 'viva', 'other'], default: 'other' },
  syllabus:    { type: String, trim: true, maxlength: 1000 },
  status:      { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  marks:       { type: Number },
  maxMarks:    { type: Number, default: 100 },
}, { timestamps: true });

const timetableSlotSchema = new mongoose.Schema({
  day:       { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday'], required: true },
  startTime: { type: String, required: true },  // "09:00"
  endTime:   { type: String, required: true },  // "10:00"
  subject:   { type: String, required: true, trim: true },
  teacher:   { type: String, trim: true },
  room:      { type: String, trim: true },
  type:      { type: String, enum: ['lecture','lab','tutorial','other'], default: 'lecture' },
}, { _id: true });

const attendanceSchema = new mongoose.Schema({
  subject:     { type: String, required: true, trim: true },
  present:     { type: Number, default: 0, min: 0 },
  total:       { type: Number, default: 0, min: 0 },
  minRequired: { type: Number, default: 75 },  // % required
}, { _id: true });

const academicProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Academic info
  institution:   { type: String, trim: true },
  degree:        { type: String, trim: true },   // B.Tech, MCA, BCA
  branch:        { type: String, trim: true },   // Computer Science
  enrollmentNo:  { type: String, trim: true },
  currentSem:    { type: Number, min: 1, max: 12, default: 1 },
  totalSems:     { type: Number, min: 2, max: 12, default: 8 },
  cgpa:          { type: Number, min: 0, max: 10 },
  totalCredits:  { type: Number, default: 0 },
  earnedCredits: { type: Number, default: 0 },
  // Marksheet parse
  lastMarksheetUrl:  { type: String },
  lastMarksheetText: { type: String, maxlength: 10000 }, // raw extracted text for AI re-parse
  marksheetParsedAt: { type: Date },
  // Academic records
  semesters:   { type: [semesterSchema],     default: [] },
  assignments: { type: [assignmentSchema],   default: [] },
  exams:       { type: [examSchema],         default: [] },
  timetable:   { type: [timetableSlotSchema], default: [] },
  attendance:  { type: [attendanceSchema],   default: [] },
}, { timestamps: true });

module.exports = mongoose.model('AcademicProfile', academicProfileSchema);
