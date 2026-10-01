import Link from "next/link";
import { DATA } from "@/data";

export default function ContactSection() {
  return (
    <div className="relative rounded-lg border bg-card/40 p-10">
      <span aria-hidden className="tron-corners tron-corners-lit inset-[7px]" />
      <div className="hud-glow absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
        <span className="hud hud-lit inline-flex items-center gap-2 px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground [--cut:6px]">
          <span aria-hidden className="flex flex-col gap-[2px]">
            <span className="h-[2px] w-2 bg-brand" />
            <span className="h-px w-1 bg-tron-red" />
          </span>
          Contact
        </span>
      </div>
      {/* The Grid floor, fading out downward. */}
      <div
        className="tron-lattice absolute inset-0 rounded-lg"
        style={{
          maskImage: "linear-gradient(to bottom, black, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 70%)",
        }}
        aria-hidden
      />
      {/* Lit from below: a 1px line with a shorter 2px core above it. */}
      <div
        className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_10px_1px_var(--brand-glow)]"
        aria-hidden
      />
      <div
        className="absolute inset-x-[32%] bottom-[3px] h-[2px] bg-gradient-to-r from-transparent via-brand-2 to-transparent"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <h2 className="glow-soft text-3xl font-bold tracking-tighter sm:text-5xl">
          Get in Touch
        </h2>
        <p className="mx-auto max-w-lg text-muted-foreground text-balance">
          Email{" "}
          <Link
            href={`mailto:${DATA.contact.email}`}
            className="text-brand hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {DATA.contact.email}
          </Link>{" "}
          to talk shop, compare notes on a project, or get a walkthrough of
          anything above.
        </p>
      </div>
    </div>
  );
}

