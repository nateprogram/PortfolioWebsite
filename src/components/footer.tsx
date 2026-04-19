import Link from "next/link";
import { DATA } from "@/data/resume";
import { Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border/60 pt-8 pb-4">
      <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <div className="font-mono">
          © {year} {DATA.name} · Built with Next.js · Deployed on Vercel
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={DATA.contact.social.GitHub.url}
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            <Github className="size-4" aria-hidden />
          </Link>
          <Link
            href={DATA.contact.social.LinkedIn.url}
            aria-label="LinkedIn"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            <Linkedin className="size-4" aria-hidden />
          </Link>
          <Link
            href={`mailto:${DATA.contact.email}`}
            aria-label="Email"
            className="hover:text-foreground transition-colors"
          >
            <Mail className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </footer>
  );
}
