// Deep-dive content for /projects/adaptive-strength.

import type { ProjectDetail } from "../types";

export const adaptiveStrength: ProjectDetail = {
  highlights: [
    "AI planning engine builds periodized five-week programs around each user's goals, schedule, and equipment profile.",
    "Workouts adapt to injuries and physical limitations by swapping exercises and scaling load.",
    "Missed sessions feed back into the plan, so progress never depends on a perfect week.",
    "Physique tracking with weight and body-composition trends, plus Health Connect sync.",
    "Offline-first React Native app built with Expo.",
  ],
  figures: [
    {
      phones: [
        {
          src: "/projects/adaptive-strength/today.jpg",
          alt: "Adaptive Strength Trainer Today screen: Week 1 Session 1, an Upper Push workout of five exercises with sets and reps, and a Start Workout button.",
        },
        {
          src: "/projects/adaptive-strength/calendar.jpg",
          alt: "Adaptive Strength Trainer calendar for July 2026 with workout, conditioning, and mobility days marked, and the logged Upper Push session for Thursday, July 2 listing weight and reps per set.",
        },
        {
          src: "/projects/adaptive-strength/physique.jpg",
          alt: "Adaptive Strength Trainer physique tracking screen with weight and body-composition trends.",
        },
      ],
      caption:
        "Today, calendar, and physique tracking. The session on the Today screen is generated from the five-week program and rescheduled around missed days.",
    },
  ],
};
