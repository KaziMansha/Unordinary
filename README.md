# Unordinary

AI-powered calendar optimization and hobby suggestion platform

---

## Table of Contents

- [Project Overview](#project-overview)  
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Installation](#installation)  

---

## Project Overview

**Unordinary** is a web application designed to help busy individuals rediscover and maintain their hobbies through intelligent, AI-driven scheduling. By syncing with existing calendar services and analyzing personal preferences (skill level, goals, availability), Unordinary automatically suggests bite-sized hobby activities and slots them into your free time—making work-life balance effortless.

---

## Features

- **User Authentication**  
  - Email/password and Google Sign-In via Firebase Auth  
- **Hobby Survey**  
  - Dynamic form to collect hobbies, skill levels, and goals  
- **Smart Suggestions**  
  - AI-generated hobby recommendations tailored to availability  
- **Calendar Integration**  
  - Two-way sync with internal calendar API  
  - “Add to Calendar” one-click event creation  
- **Responsive Dashboard**  
  - Sidebar with profile, hobby list, and suggestion controls  
- **Feedback Loop**  
  - Mood/event completion tracking to refine future suggestions  

---

## Tech Stack

- **Front-End**  
  - React & Vite  
  - TypeScript  
  - Mantine UI component library  
- **Back-End**  
  - Node.js & Express  
  - PostgreSQL (via `pg`)  
  - Firebase Admin SDK for token verification  
- **AI Integration**  
  - OpenAI / Groq AI for natural-language hobby scheduling  
- **DevOps & Tools**  
  - Docker (optional)  
  - ESLint + Prettier  
  - Cypress / Playwright for E2E testing  

---

## Getting Started

### Prerequisites

- Node.js ≥ 18  
- npm or Yarn  
- PostgreSQL database  
- Firebase project (Auth & Service Account)

### Installation
1. **Clone the repo**
```bash
   git clone https://github.com/KaziMansha/Unordinary.git
   cd Unordinary
```
2. **Install dependencies**
```bash
  npm install
  npm install @mantine/core @mantine/hooks
```
3. **Start both servers**
```bash
  # Frontend
  npm run dev

  # Backend
  npm start
```
4. **Open in browser**
Navigate to http://localhost:5173
