# AI Mock Interview Platform

A MERN stack mock interview app where candidates can generate role-specific interview rounds, submit answers, and receive AI-style coaching feedback.

## Features

- JWT authentication with registration, login, and protected routes
- MongoDB-backed interview sessions and answer history
- Role, seniority, focus area, and question-count interview setup
- Optional OpenAI-compatible chat completion integration via `AI_API_KEY`, `AI_MODEL`, and `AI_API_URL`
- Local deterministic coaching fallback when no AI provider is configured
- React dashboard, interview room, history view, and responsive UI

## Project Structure

```text
ai-mock-interview-mern/
  backend/     Express, MongoDB, auth, interview, and AI coaching APIs
  frontend/    Vite React client
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

2. Configure backend environment:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Update `backend/.env`:

   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/ai_mock_interview
   JWT_SECRET=replace-with-a-long-random-secret
   CLIENT_URL=http://localhost:5173
   AI_API_KEY=
   AI_MODEL=
   AI_API_URL=https://api.openai.com/v1/chat/completions
   ```

   Leave the AI values blank to use the built-in coaching fallback.

4. Optionally configure the frontend API URL:

   ```bash
   cp frontend/.env.example frontend/.env
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

6. Open:

   - Frontend: `http://localhost:5173`
   - Backend health check: `http://localhost:5000/api/health`

## API Summary

- `POST /api/auth/register` creates a user and returns a JWT
- `POST /api/auth/login` authenticates a user and returns a JWT
- `GET /api/auth/me` returns the current user
- `GET /api/interviews` lists the current user's interviews
- `POST /api/interviews/start` creates a new interview with generated questions
- `GET /api/interviews/:id` returns one interview
- `POST /api/interviews/:id/answers` saves an answer and generates coaching feedback
- `PATCH /api/interviews/:id/complete` marks an interview complete

## Notes

- The backend uses native `fetch`, so run it on Node.js 18 or newer.
- The AI provider call expects a chat-completions-compatible JSON response. If the provider is unavailable or returns invalid JSON, the local fallback is used.
- MongoDB must be running for persisted interviews and users.
