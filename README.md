# ADHdo! — It's ADH-doable!

> A supportive, playful productivity companion for people who struggle with task initiation, overwhelm, time blindness, distractions, low energy, or unfinished tasks.

ADHdo! helps you understand what is blocking you, reduces the mental friction required to begin, and recovers when your day does not go as planned.

---

## 🌟 Core Features

1. **My_ Day**: Welcoming dashboard with optional energy check-in (Running on empty, A little low, Doing okay, Ready to go), real interactive task management (add, edit, toggle, priority, essential/optional markers), and visual progress tracking.
2. **Unstuck Mode (Signature Feature)**: Isolate one microscopic 2-minute action tailored to your specific blocker:
   - *I can't get started.*
   - *Everything feels overwhelming.*
   - *I got distracted.*
   - *I'm running out of time.*
   - *I have no energy.*
   - Features the signature **“Make it even smaller”** button for zero-friction initiation.
3. **Help Me Start**: Breaks vague or heavy goals into 3–4 manageable sequential steps where Step 1 is ultra-simple. Allows marking steps complete and saving to My Day.
4. **Focus Timer**: Drift-free elapsed-time countdown with 5m, 15m, and 25m presets, task context display, background resilience, and celebratory finish.
5. **Bring Me Back**: Gentle, shame-free recovery experience that remembers what you were doing when interrupted and offers an easy on-ramp to resume.
6. **Untangle My Brain**: Freeform brain-dump tool that organizes stream-of-consciousness thoughts into Tasks, Reminders, Ideas, and Later with selective import.
7. **Adapt My Day**: Replanning tool to sort essential vs optional tasks, choose one key focus, and pace yourself realistically.

---

## 🎨 Visual Identity

- **Lavender**: `#C7B5FF` (Branding, selection states, signature accents)
- **Warm cream**: `#F7F1E8` (Main background)
- **Deep plum**: `#493568` (Readable text, primary actions)
- **Soft mint**: `#BDE8D1` (Positive progress, completed tasks)
- **Peach gold**: `#FFC978` (Highlights, playful accents)
- **White**: `#FFFFFF` (Cards and elevated surfaces)

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas celebration particles, Web Audio API chimes.
- **Backend / AI**: Server-side `@google/genai` TypeScript SDK with model `gemini-3.8-flash` via Express API endpoints and Vercel Serverless Functions (`api/gemini/[action].ts`).
- **Persistence**: Safe browser `localStorage` management with zero telemetry or data leaks.
- **Fail-Safe Reliability**: 100% deterministic, blocker-aware fallback engine if network or AI key is unavailable.

---

## 🚀 Local Development

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Build & Verification**:
   ```bash
   npm run build
   npm run lint
   ```

---

## 🚢 Vercel Deployment Guide

To deploy **ADHdo!** to Vercel:

1. **Push to GitHub**:
   Push the repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of ADHdo! application"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Log into [Vercel](https://vercel.com).
   - Click **Add New Project** and select your GitHub repository.
   - Framework preset will automatically detect **Vite**.

3. **Configure Environment Variables in Vercel**:
   - In the Vercel project configuration screen, open the **Environment Variables** section.
   - Add the following variable:
     - **Name**: `GEMINI_API_KEY`
     - **Value**: `<your-google-gemini-api-key>`

4. **Deploy**:
   - Click **Deploy**. Vercel will build the frontend into `dist/` and configure the serverless function `/api/gemini/:action` using `vercel.json`.

5. **Verify Live Deployment**:
   - Open your deployed Vercel URL.
   - **Non-AI flow**: Add a task in My Day, edit it, toggle complete, and verify celebration confetti.
   - **AI flow**: Navigate to **Unstuck Mode**, type an intimidating task (e.g., `"Study Theory of Computation"`), choose `"I can't get started"`, and test the micro-action generator and `"Make it even smaller"` button.

---

## 📄 License & Disclaimer

ADHdo! is a supportive productivity tool and does not claim to diagnose, prevent, or treat ADHD or any medical condition.
