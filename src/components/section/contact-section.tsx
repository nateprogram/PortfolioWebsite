import Link from "next/link";
import { DATA } from "@/data";

export default function ContactSection() {
  return (
    <div className="relative rounded-xl border bg-card/40 p-10">
      <div className="hud-glow absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
        <span className="hud hud-lit inline-flex px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground [--cut:6px]">
          Contact
        </span>
      </div>
      {/* The Grid floor, fading out downward. */}
      <div
        className="tron-lattice absolute inset-0 rounded-xl"
        style={{
          maskImage: "linear-gradient(to bottom, black, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 70%)",
        }}
        aria-hidden
      />
      {/* Lit from below. */}
      <div
        className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_10px_1px_var(--brand-glow)]"
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

