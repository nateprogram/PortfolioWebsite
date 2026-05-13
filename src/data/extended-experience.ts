// SERVER-ONLY: hidden context the resume-builder tool feeds to the LLM
// alongside the public DATA + PROJECT_DETAILS. Never import this from a
// client component. It's read only by /api/resume on the server, so it
// never ships to the browser.
//
// Anything in this file is fair game for the LLM to weave into a tailored
// resume but is NOT directly visible on natewhite.dev. Add experiences,
// context, or framing notes that should inform the AI's output.

export type ExtendedExperience = {
  /**
   * Things that aren't surfaced on the public site but are real
   * experience the LLM can pull from when relevant to a JD.
   */
  hiddenExperiences: ReadonlyArray<{
    title: string;
    dates: string;
    where?: string;
    /** What was actually built / done. Plain prose, full sentences. */
    summary: string;
    /** Stack / tools touched, if relevant. */
    technologies?: ReadonlyArray<string>;
    /** Tags that help the LLM decide when this experience is relevant. */
    relevantFor?: ReadonlyArray<string>;
  }>;

  /**
   * Plain facts about Nate that might inform tailoring.
   * Not formatted for output: the LLM decides whether and how to use them.
   */
  notes?: ReadonlyArray<string>;
};

export const EXTENDED_EXPERIENCE: ExtendedExperience = {
  hiddenExperiences: [
    {
      title: "FIRST Robotics Competition (FRC)",
      dates: "2019 – 2021",
      where: "Archbishop Murphy High School",
      summary:
        "Member of the FRC team at Archbishop Murphy High School for two competition seasons. Worked on robot programming and competed in FIRST Robotics Competition events. Hands-on exposure to path planning, computer vision, sensors and actuators, and control systems on a real working robot.",
      technologies: [
        "Java",
        "Path planning",
        "Computer vision",
        "Sensors and actuators",
        "Control systems",
      ],
      relevantFor: [
        "robotics",
        "embedded",
        "controls",
        "computer vision",
        "early hands-on engineering",
        "team-based engineering under deadline",
      ],
    },
    {
      title: "Personal NAS and home network",
      dates: "Ongoing",
      summary:
        "Self-host a UGREEN NAS for personal cloud storage and backup. Runs UGREEN's NAS software (UGOS, Linux-based) on the appliance side. Configured a mesh VPN (Tailscale-style) so the NAS is reachable from anywhere without exposing it to the public internet. Practical experience administering a small always-on home network and thinking through remote-access threat model.",
      technologies: [
        "UGREEN NAS / UGOS",
        "Mesh VPN",
        "Linux administration (consumer-NAS surface)",
        "Network configuration",
      ],
      relevantFor: [
        "home lab",
        "self-hosting",
        "networking basics",
        "VPN",
        "infrastructure curiosity",
      ],
    },
    {
      title: "Soccer Coach",
      dates: "June 2023 – Present",
      where: "Seattle United, Shoreline, WA",
      summary:
        "Three years coaching at Seattle United, a competitive youth soccer club. Co-lead a team of three coaches. Run weekly training sessions, adapt drills in real time when something isn't working, and balance the development needs of players with very different skill levels and personalities. Real ongoing leadership and communication responsibility outside software.",
      relevantFor: [
        "leadership",
        "communication",
        "mentoring",
        "well-rounded candidate signal",
        "context for SquadPact (player and team perspective)",
      ],
    },
    {
      title: "Summer Camp Counselor",
      dates: "June 2019 – August 2019",
      where: "Camp Patterson (Everett Park & Recreation), WA",
      summary:
        "Unit leader at a summer camp serving children with special needs. Led a group of younger campers, instructed a team of volunteers on the day's activities, and worked with each kid to make sure the experience was inclusive. Earned CPR certification and completed training in working with children with special needs.",
      technologies: [
        "CPR certified",
        "Special-needs child development training",
      ],
      relevantFor: [
        "leadership",
        "early responsibility",
        "communication with non-technical groups",
        "humanizing context",
      ],
    },
    {
      title: "Event Setup Crew",
      dates: "September 2021 – January 2022",
      where: "Snohomish Tents & Events, WA",
      summary:
        "Weekend job delivering and setting up tents, bounce houses, and event equipment for clients. Handled client-facing logistics on arrival and breakdown. Manual labor + customer interaction.",
      relevantFor: [
        "early work history",
        "client-facing context",
        "low priority for SWE roles",
      ],
    },
  ],

  notes: [
    "Veltarium Software LLC is a real LLC Nate registered for SquadPact and any future side products. He's the sole founder and engineer. The portfolio uses 'Apr 2025 – Present' as the start; LinkedIn currently shows 'March 2026 – Present' which is incorrect and Nate is updating LinkedIn separately. Use 'Apr 2025 – Present' on resumes.",
    "Spur Reply (previously The Spur Group) is a Redmond consulting firm. The Power Automate (Microsoft Flow) newsletter pipeline was built on a Microsoft client engagement and reached 10,000+ recipients. (LinkedIn currently shows 'over 1,000' which Nate is correcting to 10,000+.)",
    "DigiPen: Nate started in August 2022 and graduates May 2026. (LinkedIn currently shows 'January 2021' which is wrong; that was high school. Nate is correcting LinkedIn separately.) Degree: BS Computer Science. Don't claim ABET accreditation.",
    "High school: Archbishop Murphy High School, graduated 2021.",
    "Public email is NateWhite.dev@gmail.com. Personal email on past submitted resumes is Nwhit12@gmail.com. Use NateWhite.dev@gmail.com unless told otherwise.",
    "Phone: 425-518-1209.",
    "Linkedin: linkedin.com/in/nathan-white-799765218",
    "GitHub: github.com/nateprogram",
    "Lives in Redmond, WA.",
    "LinkedIn lists '.NET MAUI' as a Top Skill. Nate has not shipped anything in .NET MAUI. Do NOT include .NET MAUI in generated resumes or skill lists. (LinkedIn UI is currently not letting him remove it; Nate is working on that separately.)",
    "Writing-style rules Nate cares about: no em dashes anywhere; no AI-tell vocabulary (leverage, robust, comprehensive, seamless, dive deep, delve, intricate, crucial, vital, transformative, spearhead, synergy, holistic, streamline, in today's, etc.); concrete metrics over adjectives; recruiter-readable; do not flag projects as coursework or academic; do not mention work-style preferences (hybrid/remote/onsite/relocation/comp).",
    "If the user provides a job description, assume he wants the role. Don't hedge or suggest he might not be a fit; just produce the strongest tailored resume the corpus supports.",
    "Don't fabricate. If the JD asks for a technology Nate hasn't touched, omit it rather than claiming experience.",
    "Project ordering: pick the 3 to 5 most JD-relevant projects and order them by JD relevance, not chronology. The most relevant project is first regardless of when it happened. Drop projects that don't help the JD's narrative; a tighter resume of strong relevant work beats a sprawling one with weak entries.",
  ],
};
