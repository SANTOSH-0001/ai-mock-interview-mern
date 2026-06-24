import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true // Required once feedback is generated
    },
    summary: {
      type: String,
      trim: true
    },
    strengths: {
      type: [String],
      default: []
    },
    improvements: {
      type: [String],
      default: []
    },
    modelUsed: {
      type: String,
      default: 'local-fallback'
    }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    competency: {
      type: String,
      required: true,
      trim: true
    },
    idealSignals: {
      type: [String],
      default: []
    },
    answer: {
      type: String,
      trim: true
    },
    feedback: {
      type: feedbackSchema // Starts as undefined until evaluated
    },
    answeredAt: {
      type: Date
    }
  },
  { timestamps: true }
);

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    seniority: {
      type: String,
      required: true,
      enum: ['Intern', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager']
    },
    focus: {
      type: String,
      required: true,
      enum: ['Behavioral', 'Technical', 'System Design', 'Mixed']
    },
    status: {
      type: String,
      enum: ['draft', 'in-progress', 'completed'],
      default: 'in-progress'
    },
    questions: {
      type: [questionSchema],
      default: []
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  { timestamps: true }
);

// High-performance compound index for user dashboard queries
interviewSchema.index({ user: 1, updatedAt: -1 });

export const Interview = mongoose.model('Interview', interviewSchema);