// Deep-dive content for /projects/squadpact.

import type { ProjectDetail } from "../types";

export const squadpact: ProjectDetail = {
  problem:
    "Volunteer managers of adult soccer teams in the GSSL and Rats leagues spend hours every week on admin. Game times, opponent info, and roster changes all live on the league websites, but those sites are read-only. So each week a manager opens the league site, copies the schedule into a group chat, texts the roster to ask who's coming, chases the people who don't answer, and posts the final lineup. The data already exists. The managers are copying it to their team by hand.",
  approach:
    "Treat the league sites as the source of truth and build a scraper per league (GSSL, Rats) that turns a public team page into a structured schedule and roster. Every league module has the same interface, so adding a league means adding a module:\n\n{{code:scraper-contract}}\n\nScrapers run on a schedule and when a manager taps sync. A league-site event becomes an `Event` row in Postgres, an opponent becomes a `Team`, and every roster member gets a default RSVP. The database enforces one RSVP per user per event: a compound unique index on `(eventId, userId)` plus a composite-key upsert means clicking \"Going\" twice writes the same row, and switching between \"Going\" and \"Maybe\" updates that row.\n\n{{code:rsvp-upsert}}\n\nManagers see changes as a diff (\"here's what changed since the last sync, confirm\"), so an hour of weekly copy-paste becomes one review. The same Next.js build is wrapped in Capacitor for iOS and Android, so the scraper and domain logic exist once for web and mobile.",
  stackRationale: [
    {
      tech: "League scrapers (GSSL, Rats)",
      why: "Turn a public team URL into a structured schedule and roster. They run on a schedule plus a manager's sync button. One module per league, so adding a league means adding a module.",
    },
    {
      tech: "Next.js (App Router)",
      why: "Hosts the web UI, server components, API routes, and the scraper jobs in one project. No separate backend to deploy or version.",
    },
    {
      tech: "Capacitor",
      why: "Wraps the same Next.js build for iOS and Android. Scraper, auth, and domain logic are written once and reused across web, iOS, and Android.",
    },
    {
      tech: "Prisma + PostgreSQL",
      why: "Stores the synced league data. Composite-key upserts (e.g. `eventId_userId`) enforce one RSVP per user per event in the database.",
    },
    {
      tech: "Clerk",
      why: "Same auth flow across the web app and the Capacitor wrappers; webhook-driven user sync into Prisma on first sign-in.",
    },
    {
      tech: "Firebase Cloud Messaging",
      why: "One push pipeline for iOS, Android, and web. Action buttons carry signed tokens, so an RSVP from a notification works without a session.",
    },
    {
      tech: "Stripe + payment deep links",
      why: "Two money flows, kept apart. Players pay their league-fee share to the manager through generated Venmo, Cash App, Zelle, or PayPal links, so SquadPact never holds league money. Only the manager's per-player platform fee runs through Stripe.",
    },
    {
      tech: "Neon (prod) / Docker Postgres (dev)",
      why: "The same Postgres engine in both environments, so dev and production behave alike. Neon's hosted tier needs no setup.",
    },
  ],
  highlights: [
    "Scrapes GSSL and Rats league sites to auto-fill schedules, opponents, rosters, and results. Managers review a diff instead of copying data by hand.",
    "30-model Prisma schema covering leagues, seasons, teams, roster memberships, events, RSVPs, team and direct chat, payments, and a player marketplace.",
    "114 API route handlers across 81 route files. Business logic lives in a service layer, so routes and pages stay thin.",
    "A scheduled job moves each team through commitment, recruiting, payment collection, and active phases as deadlines pass.",
    "Push notifications carry HMAC-signed action tokens, so a player can RSVP straight from the notification without opening the app.",
    "Composite-key upserts (`eventId_userId`) enforce one RSVP per user per event in the database.",
    "One TypeScript codebase ships to web (Next.js on Vercel), iOS, and Android via Capacitor. Built under Veltarium Software LLC.",
  ],
  figures: [
    {
      phones: [
        {
          src: "/projects/squadpact/home.jpg",
          alt: "SquadPact home screen: Next Games cards with opponent, kickoff time, field, and Going / Out / Maybe RSVP buttons, plus an Upcoming list.",
        },
        {
          src: "/projects/squadpact/team.jpg",
          alt: "SquadPact team screen for Release The Kraken! in Seattle RATS Mon Coed D-1: chat, roster, stats, invite, and settings shortcuts above a Commit, Recruit, Pay, Active season timeline and upcoming games.",
        },
        {
          src: "/projects/squadpact/chat.jpg",
          alt: "SquadPact team chat thread with messages from teammates, a composer with photo and file attachments, and a notifications menu.",
        },
      ],
      caption:
        "Home, team, and chat. The next game sits at the top of home with one-tap RSVP and an add-to-calendar shortcut. The team view shows where the season is: Commit, Recruit, Pay, or Active. Chat covers the team thread and direct messages, which replaces the group chat.",
    },
  ],
  codeSnippets: [
    {
      id: "rsvp-upsert",
      title: "One-RSVP-per-user-per-event: composite-key upsert",
      description:
        "The database enforces one RSVP per user per event. A compound unique index on (eventId, userId) plus Prisma's composite-key upsert means clicking 'Going' twice writes the same row, and switching between 'Going' and 'Maybe' updates that row.",
      language: "typescript",
      code: `// prisma/schema.prisma
// model RSVP {
//   id        String     @id @default(cuid())
//   eventId   String
//   userId    String
//   status    RsvpStatus
//   updatedAt DateTime   @updatedAt
//   event     Event      @relation(fields: [eventId], references: [id])
//   user      User       @relation(fields: [userId], references: [id])
//   @@unique([eventId, userId])
// }

export async function setRsvp(
  eventId: string,
  userId: string,
  status: RsvpStatus,
) {
  return prisma.rSVP.upsert({
    where: { eventId_userId: { eventId, userId } }, // composite key
    create: { eventId, userId, status },
    update: { status },
  });
}`,
    },
    {
      id: "scraper-contract",
      title: "League scraper contract: one module per league, same shape",
      description:
        "GSSL and Rats publish schedules and rosters on their own read-only websites. Each league gets a scraper module with the same interface, so adding a league means adding a module. The domain model (Event, Team, Roster) is shared.",
      language: "typescript",
      code: `export interface LeagueScraper {
  leagueKey: "gssl" | "rats";
  fetchSchedule(teamUrl: string): Promise<ScrapedEvent[]>;
  fetchRoster(teamUrl: string): Promise<ScrapedPlayer[]>;
}

export interface ScrapedEvent {
  leagueEventId: string;   // stable id we dedupe on
  kickoffAt: Date;
  opponentName: string;
  location: string;
}

// Manager-triggered sync: scrape, diff against what's in Postgres,
// show the manager the diff, apply on confirmation. No silent writes.
export async function syncTeam(team: Team, scraper: LeagueScraper) {
  const [events, roster] = await Promise.all([
    scraper.fetchSchedule(team.leagueUrl),
    scraper.fetchRoster(team.leagueUrl),
  ]);
  const diff = await computeDiff(team.id, events, roster);
  return { diff, apply: () => persistDiff(team.id, diff) };
}`,
    },
  ],
};
