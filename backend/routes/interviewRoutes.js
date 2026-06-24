import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Interview } from '../models/Interview.js';
import { evaluateAnswer, generateQuestions } from '../utils/aiCoach.js';

export const interviewRoutes = express.Router();

interviewRoutes.use(requireAuth);

interviewRoutes.get('/', async (req, res, next) => {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select('role seniority focus status overallScore questions createdAt updatedAt');

    res.json({ interviews });
  } catch (error) {
    next(error);
  }
});

interviewRoutes.post('/start', async (req, res, next) => {
  try {
    const { role, seniority, focus, questionCount } = req.body;

    if (!role || !seniority || !focus) {
      return res.status(400).json({ message: 'Role, seniority, and focus are required' });
    }

    const questions = await generateQuestions({
      role,
      seniority,
      focus,
      questionCount: Number(questionCount) || 5
    });

    const interview = await Interview.create({
      user: req.user._id,
      role,
      seniority,
      focus,
      questions
    });

    res.status(201).json({ interview });
  } catch (error) {
    next(error);
  }
});

interviewRoutes.get('/:id', async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ interview });
  } catch (error) {
    next(error);
  }
});

interviewRoutes.post('/:id/answers', async (req, res, next) => {
  try {
    const { questionId, answer } = req.body;

    if (!questionId || !answer?.trim()) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const question = interview.questions.id(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const feedback = await evaluateAnswer({
      role: interview.role,
      seniority: interview.seniority,
      focus: interview.focus,
      question: question.prompt,
      competency: question.competency,
      idealSignals: question.idealSignals,
      answer
    });

    question.answer = answer.trim();
    question.feedback = feedback;
    question.answeredAt = new Date();

    const answeredQuestions = interview.questions.filter((item) => item.answer);
    const totalScore = answeredQuestions.reduce((sum, item) => sum + item.feedback.score, 0);
    interview.overallScore = answeredQuestions.length ? Math.round(totalScore / answeredQuestions.length) : 0;
    interview.status = answeredQuestions.length === interview.questions.length ? 'completed' : 'in-progress';

    await interview.save();

    res.json({ interview, feedback });
  } catch (error) {
    next(error);
  }
});

interviewRoutes.patch('/:id/complete', async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      { status: 'completed' },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ interview });
  } catch (error) {
    next(error);
  }
});
