import BlurFade from "@/components/magicui/blur-fade";
import { ProjectCard } from "@/components/project-card";
import { Icons } from "@/components/icons";
import { DATA } from "@/data/resume";

const BLUR_FADE_DELAY = 0.04;

export const metadata = {
  title: "Games",
  description: "Games Nate White has shipped, contributed to, or built solo.",
};

export default function GamesPage() {
  return (
    <main className="min-h-dvh flex flex-col gap-14 relative">
      <section id="games-hero">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <BlurFade delay={BLUR_FADE_DELAY}>
            <h1 className="text-3xl font-semibold tracking-tighter sm:text-4xl lg:text-5xl">
              Games
            </h1>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 2}>
            <p className="text-muted-foreground md:text-lg lg:text-xl">
              Game development at DigiPen is engineering under hard real-time
              constraints — frame budgets, memory locality, deterministic
              simulation, and shipping with a team. These are projects I&apos;ve
              built solo or contributed engineering work to.
            </p>
          </BlurFade>
        </div>
      </section>

      <section id="games-grid">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto auto-rows-fr">
          {DATA.games.map((game, id) => {
            const tags = [game.engine, game.role];
            const links = game.links.map((link) => ({
              type: link.type,
              href: link.href,
              icon: <Icons.github className="size-3" />,
            }));
            return (
              <BlurFade
                key={game.slug}
                delay={BLUR_FADE_DELAY * 3 + id * 0.05}
                className="h-full"
              >
                <ProjectCard
                  href={game.links[0]?.href ?? "#"}
                  title={game.title}
                  description={game.summary}
                  dates={game.year}
                  tags={tags}
                  image={game.image}
                  video={game.video}
                  links={links}
                />
              </BlurFade>
            );
          })}
        </div>
      </section>
    </main>
  );
}
