# Recovery and Prevention Platform

A voice-first, GenAI-powered recovery and prevention web app for individuals navigating substance use disorders and caregivers supporting them.

## What It Includes

- Voice input with the browser Web Speech API
- Spoken AI responses with browser speech synthesis
- Groq-powered chat API through a Vercel serverless function
- Recovery, emergency, caregiver, planning, and learning modes
- Trusted support contact storage in the browser
- Crisis-aware system prompt and safe fallback response

## Keys You Need

Use Groq for the AI text engine. Yes, you can use a Groq key if your account has free-tier access.

Create:

- `GROQ_API_KEY` from the Groq console
- Optional `GROQ_MODEL`, default: `llama-3.3-70b-versatile`

You do not need a separate paid voice key for this version. It uses browser speech recognition and speech synthesis. Chrome/Edge usually work best. If you later want production-grade voice, good options are OpenAI Realtime API, Deepgram, ElevenLabs, or AssemblyAI, but those may require billing.

## Local Setup

```bash
npm install
copy .env.example .env.local
```

Put your Groq key in `.env.local`:

```bash
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Run:

```bash
npm run dev:vercel
```

Open the local URL Vercel prints. This runs both the Vite frontend and `/api/chat`.

For frontend-only testing, you can also run `npm run dev`, but AI chat needs `npm run dev:vercel`.

## GitHub Push

```bash
git init
git add .
git commit -m "Build recovery prevention platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Do not commit `.env.local`. It is ignored.

## Vercel Deployment

1. Push the project to GitHub.
2. Open Vercel and import the GitHub repo.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add Environment Variables:
   - `GROQ_API_KEY`
   - `GROQ_MODEL` optional
7. Deploy.

## GitHub Secrets

For normal Vercel GitHub integration, you do not need GitHub secrets. Put `GROQ_API_KEY` in Vercel Environment Variables.

Only add a GitHub secret if you create a GitHub Actions workflow. In that case, add it at:

`GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret`

Name: `GROQ_API_KEY`

## Safety Note

This app is educational and supportive. It is not medical advice, therapy, diagnosis, emergency dispatch, or a replacement for professional care.
