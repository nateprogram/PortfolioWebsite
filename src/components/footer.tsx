import Link from "next/link";
import { DATA } from "@/data";
import { Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 pt-8 pb-4">
      <div className="flex items-center justify-center gap-4 text-muted-foreground">
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
    </footer>
  );
}
