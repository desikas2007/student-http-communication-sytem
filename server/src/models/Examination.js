import mongoose from 'mongoose';

const examinationSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: 100,
    },
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    examType: {
      type: String,
      required: [true, 'Exam type is required'],
      trim: true,
      maxlength: 60,
    },
    date: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:MM format'],
    },
    room: {
      type: String,
      required: [true, 'Room is required'],
      trim: true,
      maxlength: 60,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: 40,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 1,
      max: 5,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 10,
    },
    instructions: {
      type: String,
      default: '',
      maxlength: 600,
    },
  },
  {
    timestamps: true,
  }
);

examinationSchema.index({ date: 1, startTime: 1 });
examinationSchema.index({ department: 1, year: 1 });

/** Exams scheduled after the given moment (default: now). */
examinationSchema.statics.findUpcoming = function findUpcoming(from = new Date()) {
  return this.find({ date: { $gte: from } }).sort({ date: 1, startTime: 1 });
};

/** Exams already conducted before the given moment (default: now). */
examinationSchema.statics.findCompleted = function findCompleted(before = new Date()) {
  return this.find({ date: { $lt: before } }).sort({ date: -1, startTime: -1 });
};

export default mongoose.model('Examination', examinationSchema);
