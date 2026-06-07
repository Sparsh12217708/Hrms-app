# AI-Powered Next-Gen Human Resource Management System (HRMS)

### 🔗 **Live Website Link:** [https://hrms-ruddy-three.vercel.app](https://hrms-ruddy-three.vercel.app)

---

## 📸 Screenshots

| 🎨 Corporate Login Portal | 📊 Management Admin Dashboard |
|---|---|
| ![SaaS Login Screen](/public/screenshot1.png) | ![Overview Dashboard](/public/screenshot2.png) |

| 👥 Employee Directory & Status | 🤖 AI Candidate Interview Bot |
|---|---|
| ![Employee Directory](/public/screenshot3.png) | ![AI Interview Bot](/public/screenshot4.png) |

| 💬 AI Policy Virtual Assistant |
|---|
| ![AI Handbook Chatbot](/public/screenshot5.png) |

---

Welcome to the **Next-Gen Human Resource Management System (HRMS)**, built as a submission for the **FWC AI/ML with Fullstack Engineer Hackathon**. 

This platform showcases a robust, high-performance, full-stack architecture built using **Next.js App Router (TypeScript)**, custom styled with **Vanilla CSS Modules** (no Tailwind, per requirements), and powered by **Gemini AI** integrations (with robust simulated fallbacks).

---

## 🚀 Key Features

### 1. Core HRMS Functionalities
* **Multi-Role Tailored Dashboards:** Dedicated panels for:
  * **Management Admin:** Global analytics, company metrics (disbursements, headcounts), and live database telemetry tracking.
  * **Senior Manager:** Team check-in statuses, leave approval management, team OKRs, and employee attrition/burnout alerts.
  * **HR Recruiter:** Candidate pipeline management, CV uploads, screening, and chat interview simulators.
  * **Employee:** Self-service clock-in, leave logs, objectives tracking, payslip invoice downloads, and policies chatbot support.
* **Attendance Tracking:** Real-time clock-in/out stamps with automatic late flag calculations.
* **Payroll Invoicing:** Deductions (tax, PF) and allowances slip generator creating print-friendly custom invoices.
* **Performance (OKRs):** Company, team, and individual OKRs tracking. Managers can assign appraisals and grade employees (1-5 stars).

### 2. The 4 AI-Powered Modules
1. **AI Resume Screening:** Recruiters can input a candidate's resume and job description. The AI parses the text, calculates a fitment score (0-100%), extracts matching and missing skills, writes a detailed review, and generates tailored screening questions.
2. **AI Candidate Interview Bot:** Select a candidate and launch a screening session. An interactive, scrolling chatbot simulates an automated HR interview. It interprets responses, generates context-aware follow-up questions, and concludes by issuing a graded scorecard and updating candidate status.
3. **AI Performance & Attrition Predictor:** Evaluates employee profiles (hours clocked, attendance rates, reviews, salary, skills). AI forecasts next appraisal scores (1-5 stars), flags attrition risk (Low/Medium/High) with attrition probability, and writes retention action recommendations.
4. **AI Policy Virtual Assistant:** A conversational bot trained on the Employee Handbook. Employees can ask about leave allowances, core hours, WFH rules, or training reimbursements, receiving accurate answers and references to source guidelines.

---

## 🛠️ Built With (Tech Stack)

* **Core Framework:** Next.js (App Router, React 19, TypeScript)
* **AI & NLP Integration:** Google Gemini AI SDK (`@google/generative-ai`)
* **Styling Design:** Vanilla CSS Modules (scoped, type-safe styles, no TailwindCSS)
* **State & Sessions:** JWT (JSON Web Tokens) with secure HttpOnly cookie sessions
* **Database Engine:** Custom indexed in-memory JSON database wrapper (O(1) Map indexing, async debounced file-writing)
* **Development Runner:** `tsx` (TypeScript Execute)
* **UI Icons:** Lucide React
* **Hosting & Cloud:** Vercel (Production serverless cloud hosting)

---

## ⚡ Scaling & Telemetry (5,000+ Employees)

To meet FWC scalability standards, the system is backed by an in-memory, mapped JSON database wrapper in [`lib/db.ts`](lib/db.ts) that caches records on startup and commits updates to disk asynchronously using debounced writes. This enables O(1) indexed reads for individual profiles and sub-millisecond fuzzy search filters.

### Performance Verification Logs

To verify query times on **5,009 seeded records**:
```bash
npx tsx scripts/test-scale.ts
```

**Output Results:**
* **Total Operations Executed:** 1,000 searches/filters
* **Average Latency Per Query:** **0.0989 ms** (well below the 50ms SLA)
* **O(1) Map Lookup by ID:** **0.0420 ms**
* **O(1) Map Lookup by Email:** **0.0161 ms**

*Note: Live latency telemetry metrics are displayed directly in the Admin Dashboard and Employee Directory grid headers.*

---

## 🛠️ Quick Start Guide

### 1. Setup & Seeding
1. Clone the project and install standard packages:
   ```bash
   npm install
   ```
2. Seed the database with 5,009 employee records, OKRs, leave applications, and recruitment candidate logs:
   ```bash
   npx tsx scripts/seed.ts
   ```

### 2. Configure AI Environment (Optional)
This application operates in dual-mode. 
* **Live AI Mode:** Add your Google Gemini API key to a `.env` file in the root directory:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
* **Simulated AI Mode:** If no key is set, the system automatically falls back to an internal NLP heuristics model. This ensures all chatbots, resume screeners, and attrition analyzers remain fully functional and demo-able.

### 3. Launch Development Server
Start the local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Demo Login Credentials

The home landing page features a **Quick Login Selector** to easily jump between dashboards:
1. **Management Admin:** Log in with `admin@fwc.com`
2. **Senior Manager:** Log in with `manager.eng@fwc.com`
3. **HR Recruiter:** Log in with `recruiter.neha@fwc.com`
4. **Employee:** Log in with `meghna.kothari.1@fwc.com` (selects first employee record)
