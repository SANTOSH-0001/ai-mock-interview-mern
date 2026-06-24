const questionBank = {
  Behavioral: [
    {
      competency: 'Ownership',
      prompt: 'Tell me about a time you took ownership of a difficult problem from start to finish.',
      idealSignals: ['clear context', 'specific action', 'measurable outcome', 'reflection']
    },
    {
      competency: 'Communication',
      prompt: 'Describe a time you had to explain a complex idea to someone outside your domain.',
      idealSignals: ['audience awareness', 'simple framing', 'feedback loop', 'result']
    },
    {
      competency: 'Conflict Resolution',
      prompt: 'Tell me about a disagreement with a teammate and how you handled it.',
      idealSignals: ['empathy', 'facts over assumptions', 'trade-offs', 'shared decision']
    },
    {
      competency: 'Adaptability',
      prompt: 'Give an example of a time priorities changed suddenly. What did you do?',
      idealSignals: ['reprioritization', 'stakeholder updates', 'risk management', 'learning']
    },
    {
      competency: 'Leadership',
      prompt: 'Tell me about a time you helped a team perform better.',
      idealSignals: ['team diagnosis', 'specific intervention', 'measurable impact', 'humility']
    }
  ],
  Technical: [
    {
      competency: 'Problem Solving',
      prompt: 'Walk me through how you would debug a production performance issue.',
      idealSignals: ['hypothesis', 'instrumentation', 'isolation', 'rollback plan']
    },
    {
      competency: 'Code Quality',
      prompt: 'How do you decide when to refactor code versus shipping the feature as-is?',
      idealSignals: ['risk assessment', 'maintainability', 'business context', 'incremental plan']
    },
    {
      competency: 'Data Modeling',
      prompt: 'Design a MongoDB schema for tracking interviews, questions, and answer feedback.',
      idealSignals: ['relationships', 'indexes', 'embedding trade-offs', 'query patterns']
    },
    {
      competency: 'API Design',
      prompt: 'Design an API endpoint for submitting an interview answer and returning feedback.',
      idealSignals: ['validation', 'auth', 'error handling', 'idempotency']
    },
    {
      competency: 'Testing',
      prompt: 'What tests would you write for a login flow in a MERN application?',
      idealSignals: ['unit tests', 'integration tests', 'security cases', 'happy and unhappy paths']
    }
  ],
  'System Design': [
    {
      competency: 'Architecture',
      prompt: 'Design a scalable mock interview platform that supports live sessions and AI feedback.',
      idealSignals: ['service boundaries', 'data flow', 'queues', 'observability']
    },
    {
      competency: 'Scalability',
      prompt: 'How would you handle spikes when thousands of users request AI feedback at once?',
      idealSignals: ['rate limits', 'queueing', 'backpressure', 'caching']
    },
    {
      competency: 'Reliability',
      prompt: 'How would you make sure answer submissions are not lost if the AI provider is down?',
      idealSignals: ['persistence first', 'retry strategy', 'fallback', 'status tracking']
    },
    {
      competency: 'Security',
      prompt: 'What security controls matter most for a platform storing interview responses?',
      idealSignals: ['auth', 'authorization', 'encryption', 'least privilege']
    },
    {
      competency: 'Observability',
      prompt: 'What metrics and logs would you collect for this platform?',
      idealSignals: ['latency', 'error rates', 'AI cost', 'business funnel']
    }
  ]
};

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeFocus(focus) {
  return questionBank[focus] ? focus : 'Mixed';
}

function fallbackQuestions({ role, seniority, focus, questionCount }) {
  const selectedFocus = normalizeFocus(focus);
  const source =
    selectedFocus === 'Mixed'
      ? questionBank.Behavioral.flatMap((question, index) => [
          question,
          questionBank.Technical[index],
          questionBank['System Design'][index]
        ]).filter(Boolean)
      : questionBank[selectedFocus];

  return source.slice(0, Math.max(1, Math.min(questionCount, 8))).map((question) => ({
    ...question,
    prompt: `${question.prompt} Frame your answer for a ${seniority} ${role} interview.`
  }));
}

function canUseRemoteAI() {
  const ready = Boolean(process.env.AI_API_KEY && process.env.AI_MODEL && process.env.AI_API_URL);
  if (!ready && (process.env.AI_API_KEY || process.env.AI_MODEL)) {
    // Partially configured – warn once so the developer can spot the missing value
    console.warn(
      '[aiCoach] Remote AI is partially configured. Set AI_API_KEY, AI_MODEL, and AI_API_URL ' +
        '(e.g. https://api.groq.com/openai/v1/chat/completions) to enable it.'
    );
  }
  return ready;
}

function extractJson(content) {
  const trimmed = content.trim();

  // Plain JSON object or array (most common with json_object mode)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }

  // Markdown code-fence (some Groq models still wrap output)
  const fenceMatch =
    trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }

  // Last-resort: find the first { ... } block anywhere in the response
  const braceMatch = trimmed.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return JSON.parse(braceMatch[0]);
  }

  throw new Error('AI response did not include valid JSON. Raw response: ' + trimmed.slice(0, 200));
}

async function requestJson(messages) {
  const response = await fetch(process.env.AI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL,
      messages,
      temperature: 0.4,
      // json_object mode is supported by Groq – the system prompt must also
      // explicitly request JSON (enforced in each caller below).
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = await response.json();
      // Groq surfaces errors under errBody.error.message
      detail = errBody?.error?.message || JSON.stringify(errBody);
    } catch (_) {
      detail = await response.text().catch(() => '');
    }
    throw new Error(`AI provider returned ${response.status}: ${detail}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('AI provider returned an empty response');
  }

  return extractJson(content);
}

export async function generateQuestions(input) {
  const questionCount = Math.max(1, Math.min(Number(input.questionCount) || 5, 8));

  if (!canUseRemoteAI()) {
    return fallbackQuestions({ ...input, questionCount });
  }

  try {
    const payload = await requestJson([
      {
        role: 'system',
        // Groq's json_object mode requires the system prompt to explicitly
        // instruct the model to respond with JSON.
        content:
          'You generate concise mock interview questions. ' +
          'Respond in JSON. ' +
          'Return a JSON object with a "questions" array. ' +
          'Each element must have "prompt" (string), "competency" (string), and "idealSignals" (array of strings). ' +
          'Do not include any text outside the JSON object.'
      },
      {
        role: 'user',
        content: JSON.stringify({
          role: input.role,
          seniority: input.seniority,
          focus: input.focus,
          questionCount
        })
      }
    ]);

    if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
      throw new Error('AI response did not include questions');
    }

    const questions = payload.questions
      .slice(0, questionCount)
      .map((question) => ({
        prompt: String(question.prompt || '').trim(),
        competency: String(question.competency || 'General').trim(),
        idealSignals: Array.isArray(question.idealSignals)
          ? question.idealSignals.map((signal) => String(signal).trim()).filter(Boolean).slice(0, 5)
          : []
      }))
      .filter((question) => question.prompt);

    return questions.length ? questions : fallbackQuestions({ ...input, questionCount });
  } catch (error) {
    console.warn('Using fallback questions:', error.message);
    return fallbackQuestions({ ...input, questionCount });
  }
}

function scoreAnswer({ answer, idealSignals }) {
  const normalizedAnswer = answer.toLowerCase();
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const signalMatches = idealSignals.filter((signal) => normalizedAnswer.includes(signal.toLowerCase().split(' ')[0]));
  const hasStructure = ['situation', 'task', 'action', 'result', 'first', 'then', 'because'].some((word) =>
    normalizedAnswer.includes(word)
  );
  const hasMetrics = /\d|percent|%|reduced|increased|improved|saved|faster|slower/.test(normalizedAnswer);

  return clampScore(35 + Math.min(wordCount, 160) * 0.18 + signalMatches.length * 10 + (hasStructure ? 12 : 0) + (hasMetrics ? 10 : 0));
}

function fallbackFeedback(input) {
  const score = scoreAnswer(input);
  const isStrong = score >= 75;
  const isDeveloping = score < 55;

  return {
    score,
    summary: isStrong
      ? 'Strong answer with useful detail and a clear connection to the interview prompt.'
      : isDeveloping
        ? 'The answer has a starting point, but it needs more structure, evidence, and outcome detail.'
        : 'Solid answer overall; adding sharper examples and measurable outcomes would make it stronger.',
    strengths: [
      input.answer.length > 140 ? 'Provides enough substance for the interviewer to evaluate.' : 'Keeps the answer concise.',
      input.answer.match(/\b(I|we|my|our)\b/i) ? 'Uses first-hand experience rather than staying fully abstract.' : 'Addresses the prompt directly.'
    ],
    improvements: [
      'Use a clear STAR-style arc: situation, task, action, result.',
      'Add specific constraints, trade-offs, or metrics to make the impact concrete.',
      `Tie the answer back to the ${input.competency.toLowerCase()} competency.`
    ],
    modelUsed: 'local-fallback'
  };
}

export async function evaluateAnswer(input) {
  if (!canUseRemoteAI()) {
    return fallbackFeedback(input);
  }

  try {
    const payload = await requestJson([
      {
        role: 'system',
        // Groq's json_object mode requires the system prompt to explicitly
        // instruct the model to respond with JSON.
        content:
          'You are a practical interview coach. ' +
          'Respond in JSON. ' +
          'Return a JSON object with exactly these keys: ' +
          '"score" (integer 0-100), ' +
          '"summary" (string), ' +
          '"strengths" (array of strings), ' +
          '"improvements" (array of strings). ' +
          'Do not include any text outside the JSON object.'
      },
      {
        role: 'user',
        content: JSON.stringify({
          role: input.role,
          seniority: input.seniority,
          focus: input.focus,
          question: input.question,
          competency: input.competency,
          idealSignals: input.idealSignals,
          answer: input.answer
        })
      }
    ]);

    return {
      score: clampScore(Number(payload.score) || 0),
      summary: String(payload.summary || '').trim() || 'Feedback generated.',
      strengths: Array.isArray(payload.strengths)
        ? payload.strengths.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
        : [],
      improvements: Array.isArray(payload.improvements)
        ? payload.improvements.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
        : [],
      modelUsed: process.env.AI_MODEL
    };
  } catch (error) {
    console.warn('Using fallback feedback:', error.message);
    return fallbackFeedback(input);
  }
}
