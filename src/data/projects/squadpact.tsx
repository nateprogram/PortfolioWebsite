// Deep-dive content for /projects/squadpact.

import type { ProjectDetail } from "../types";

export const squadpact: ProjectDetail = {
  problem:
    "Volunteer managers of adult soccer teams in the GSSL and Rats leagues burn hours every week on unpaid admin. Game times, opponent info, and roster changes all live on the league websites, but those sites are read-only UIs meant for browsing. So each week a manager opens the league site, copies the schedule into a group chat, texts the roster to ask who's coming, chases the non-responders, and posts the final lineup. The data already exists in a canonical form; the managers are just acting as a human API between it and their team.",
  approach:
    'Treat the league sites as the source of truth and build a scraper per league (GSSL, Rats) that resolves a public team page into a structured schedule and roster. One module per league, same interface, so adding a new league is a new module rather than a rewrite:\n\n{{code:scraper-contract}}\n\nScrapers run on a cron and on manager-triggered sync, hydrating the app\'s domain model: a league-site event becomes an `Event` row in Postgres, an opponent becomes a `Team`, the default RSVP state propagates to every roster member. RSVP uniqueness is a database invariant, not an app-code check: a compound unique index on `(eventId, userId)` plus a composite-key upsert means a user clicking "Going" twice writes the same row, and flipping between "Going" and "Maybe" mutates one row instead of inserting two.\n\n{{code:rsvp-upsert}}\n\nManager-facing flows are diffs ("here\'s what changed since last sync, confirm"), so their weekly job collapses from an hour of copy-paste into a single review pass. Cross-platform delivery is a secondary concern: a single Next.js build wraps in Capacitor to ship web, iOS, and Android from one codebase, so the scraper and domain logic are written and maintained exactly once.',
  stackRationale: [
    {
      tech: "League scrapers (GSSL, Rats)",
      why: "Resolve a public team URL into a structured schedule and roster. Run on a cron plus a manager-triggered sync button. One module per league, so adding a new league is a new module rather than a rewrite.",
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
      why: "Canonical store for synced league data. Composite-key upserts (e.g. `eventId_userId`) enforce one-RSVP-per-user-per-event in the database, not in app code.",
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
      why: "Same Postgres engine in both environments (no sqlite-vs-postgres drift), with a zero-config cloud tier for production.",
    },
  ],
  highlights: [
    "Scrapes GSSL and Rats league sites to auto-fill schedules, opponents, rosters, and results. Managers review a diff instead of copying data by hand.",
    "30-model Prisma schema covering leagues, seasons, teams, roster memberships, events, RSVPs, team and direct chat, payments, and a player marketplace.",
    "114 API route handlers across 81 route files. Business logic lives in a service layer, so routes and pages stay thin.",
    "Cron-driven season lifecycle: each team moves through commitment, recruiting, payment collection, and active phases as deadlines pass.",
    "Push notifications carry HMAC-signed action tokens, so a player can RSVP straight from the notification without opening the app.",
    "Composite-key upserts (`eventId_userId`) enforce one-RSVP-per-user-per-event in the database, not in app code.",
    "One TypeScript codebase ships to web (Next.js on Vercel), iOS, and Android via Capacitor. Shipping under Veltarium Software LLC.",
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
        "Home, team, and chat. The next game sits at the top of home with one-tap RSVP and an add-to-calendar shortcut. The team view shows where the season is in its Commit, Recruit, Pay, Active lifecycle. Chat covers the team thread and direct messages, so the group chat the managers used to live in isn't needed.",
    },
  ],
  codeSnippets: [
    {
      id: "rsvp-upsert",
      title: "One-RSVP-per-user-per-event: composite-key upsert",
      description:
        "RSVP uniqueness is a database invariant, not something app code enforces. A compound unique index on (eventId, userId) plus Prisma's composite-key upsert means a user clicking 'Going' twice writes the same row, and flipping between 'Going' and 'Maybe' mutates one row instead of inserting two.",
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
        "GSSL and Rats publish their schedules and rosters on their own read-only websites. Each league gets its own scraper module that implements the same interface, so adding a new league is a new module, not a rewrite. The domain model (Event, Team, Roster) is shared.",
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
