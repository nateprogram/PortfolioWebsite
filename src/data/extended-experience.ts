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
  ],

  notes: [
    "Veltarium Software LLC is a real LLC Nate registered for SquadPact and any future side products. He's the sole founder and engineer.",
    "Spur Reply (previously The Spur Group) is a Redmond consulting firm. The 10,000+ recipient Power Automate newsletter pipeline was built on a Microsoft client engagement at Spur.",
    "DigiPen is the school. The degree is BS Computer Science (not the RTIS specialization). Don't claim ABET accreditation.",
    "Public email is NateWhite.dev@gmail.com. Personal email on past submitted resumes is Nwhit12@gmail.com. Use NateWhite.dev@gmail.com unless told otherwise.",
    "Phone: 425-518-1209.",
    "Linkedin: linkedin.com/in/nathan-white-799765218",
    "GitHub: github.com/nateprogram",
    "Lives in Redmond, WA.",
    "Writing-style rules Nate cares about: no em dashes anywhere; no AI-tell vocabulary (leverage, robust, comprehensive, seamless, dive deep, delve, intricate, crucial, vital, transformative, spearhead, synergy, holistic, streamline, in today's, etc.); concrete metrics over adjectives; recruiter-readable; do not flag projects as coursework or academic; do not mention work-style preferences (hybrid/remote/onsite/relocation/comp).",
    "If the user provides a job description, assume he wants the role. Don't hedge or suggest he might not be a fit; just produce the strongest tailored resume the corpus supports.",
    "Don't fabricate. If the JD asks for a technology Nate hasn't touched, omit it rather than claiming experience.",
  ],
};
