# Tekzow-PLS

> **Python Practical Learning Platform (V1.0)**  
> Complete Beginner → Intermediate Curriculum | 20 Levels | 100 Progressive Coding Problems | Milestone Assignments

---

## 🌟 Overview

**Tekzow-PLS** is a full-stack, browser-based Python learning platform where students learn programming concepts and immediately apply them inside an integrated coding workspace. The platform eliminates the need for any local IDE configuration, offering real-time code execution, intelligent pedagogical debugging, automated visible and hidden test case evaluation, and a progression unlock engine.

---

## 🚀 Key Features

- **20 Progressive Levels & 100 Handcrafted Problems**:
  - **Levels 1–5 (Foundations & Conditions)**: I/O, variables, type conversions, arithmetic operators, branching, and Milestone 1 (*Student Result Management*).
  - **Levels 6–10 (Loops & Algorithms)**: for/while loops, nested pattern building, number reasoning, prime numbers, factorials, Fibonacci, and Milestone 2 (*Number Analyzer*).
  - **Levels 11–15 (Strings & Lists)**: Indexing, slicing, anagrams, frequency counting, list transformations, and Milestone 3 (*Student Marks Analyzer*).
  - **Levels 16–20 (Data Structures & Modularity)**: Tuples, sets, dictionaries, functions, exception handling (`try/except`), and Milestone 4 (*Complete Student Management System*).
- **Monaco Code Editor**: VS Code-style editor with Python syntax highlighting, automatic indentation, and code reset.
- **Isolated Python Execution Sandbox**: Executes Python 3 in temporary scratch directories with AST security screening, 4000ms execution timeout limits, and sanitized tracebacks.
- **Automated Visible + Hidden Test Evaluation**: Evaluates outputs line-by-line with whitespace normalization and floating-point numeric tolerance. Hidden tests are evaluated strictly on the server and never exposed to the client.
- **Smart Debugger & Traceback Analyzer**: Categorizes runtime/syntax errors (`SyntaxError`, `NameError`, `TypeError`, `ZeroDivisionError`, `IndexError`, etc.), locates the exact line of code, and provides friendly advice on how to fix it.
- **Progression & Level Unlock State Machine**: Level 1 is unlocked by default; completing all 5 problems in a level automatically unlocks the next level.
- **Role-Based Access Control (RBAC)**:
  - Students cannot access locked levels or administrative features.
  - Platform administrators have access to live submission metrics, acceptance rates, and progress reset controls.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Backend**: Next.js Server Components & Route Handlers
- **Database & ORM**: SQLite via Prisma ORM (easily swappable to PostgreSQL)
- **Auth**: JWT session cookies with bcryptjs password hashing and Next.js Edge Middleware
- **Execution Sandbox**: Node.js isolated child process runner with AST static security validation

---

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **Python**: Python 3.8+ installed on system PATH

### 2. Installation
```bash
git clone https://github.com/tekzowdevelopers-coder/Tekzow-PLS.git
cd Tekzow-PLS
npm install
```

### 3. Database Setup & Seeding
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## 👤 Default Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Demo Student** | `student@example.com` | `password123` |
| **Platform Admin** | `admin@example.com` | `admin123` |

---

## 🧪 Running Automated Tests

Run the end-to-end verification and access control test suites:
```bash
# E2E Platform Suite (25 Tests)
node test_e2e.mjs

# Authentication & Access Control Suite (18 Tests)
node test_auth_access.mjs
```

---

## 📄 License
MIT
