// The plain text of Nate's resume, used by the ATS keyword tool to flag
// which JD keywords are NOT already present in the resume.
//
// Seeded from the finalized resume content. If the wording in the actual
// submitted PDF drifts from this, paste the PDF's text in here so the
// "missing from your resume" flags stay accurate. The matcher only cares
// about which words/phrases appear, not formatting — a rough paste of the
// full resume text is enough.

export const RESUME_TEXT = `
Nate White
Software Engineer | C++ / C# / Python / System Design / ML
Seattle, WA | (425) 518-1209 | NateWhite.dev@gmail.com
linkedin.com/in/nathan-white-799765218 | github.com/nateprogram | natewhite.dev

Summary
C++, C#, Python, and TypeScript engineer. Shipped a cross-platform scheduling app under my LLC. Created a live ML trading research platform and a custom C++ engine. I use Claude Code to ship MVPs fast. Shipped with multi-disciplinary teams of 6 and 19 at DigiPen.

Skills
Languages: C++, C#, Python, TypeScript, Java
Frameworks & Engines: PyTorch, FastAPI, Next.js, React, Capacitor, Unreal Engine 5, Unity, OpenGL
Tools, Infrastructure & Databases: Git, Docker, Jenkins, Vercel, Linux, PostgreSQL, Prisma, SQLite

Education
BS Computer Science & Game Design | DigiPen Institute of Technology | Redmond, WA | 2021 - 2026

Experience
Founder & Engineer | Veltarium Software LLC | Redmond, WA | Mar 2026 - May 2026
- Built a cross-platform scheduling app for adult soccer league players and managers, shipped under my LLC.
- Wrote a 19-model Prisma schema and 40+ API handlers covering leagues, seasons, teams, rosters, events, RSVPs, chats, payments, and a player marketplace.
- Uses external tools such as Neon, Clerk for user auth, Stripe for payment processing, Firebase for push notifications.
- Backend sources league sites and auto-populates the database with season schedules and teams.
- Single TypeScript codebase across web (Vercel) and mobile (Capacitor for iOS / Android).

Software Development Intern | Spur Reply | Redmond, WA | Jun 2021 - Aug 2021
- Shipped React + TypeScript client microsites through the firm's .NET + Azure DevOps pipeline.
- Developed Power BI dashboards across multiple projects for client-facing data.

Software Development Intern | Spur Reply | Redmond, WA | Jun 2020 - Aug 2020
- Automated a weekly newsletter pipeline reaching 10,000+ Microsoft employees, replacing a fully manual workflow.
- Created an internal Employee Morale Survey tool with Microsoft Power Automate that worked directly in Microsoft Teams.

Projects
StockAI | Live ML trading research platform | Python, PyTorch, FastAPI | 2024 - 2026
- Designed a MultiHeadLSTM which sources data about specific stocks from Yahoo Finance, news articles, and social media platforms including YouTube, X, and Reddit to predict price movements.
- ~11,500 LOC across 42 modules. Data feeds into correlation analyzers and an LSTM that makes predictions on stock prices.
- Predictions are evaluated for accuracy by a retrainer that fine tunes weights; the retrainer has automatic rollback to combat degradation.

Mayhem Engine | Custom C++ game engine | C++, GLFW, rapidjson, OpenGL | 2023 - 2024
- Created a particle system with JSON-serialized emitters that hot-reload from disk without a C++ rebuild.
- Wrote the stat/upgrade system with per-level upgrade arrays so designers retune the curve by editing JSON.
- Designed the engine's input abstraction over GLFW. Shipped the tower-offense title Zeppelin Rush to Steam.

Genetic AI | Modular genetic algorithm that plays games to find optimal strategies | Python | 2024
- Evolved a Python genetic algorithm that played Zeppelin Rush and found the optimal strategy in 16 generations.

Treasure Party | Local 4-player couch party game | Unity, C# | 2024
- Owned several minigames with their own state machines built with custom C# classes.
- Authored the project's scene-persistent AudioManager with a priority-based channel pool.
`.trim();
