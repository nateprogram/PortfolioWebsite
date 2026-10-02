// Deep-dive content for /projects/zeppelin-rush.

import type { ProjectDetail } from "../types";

export const zeppelinRush: ProjectDetail = {
  problem:
    "A genetic algorithm depends on its fitness function. Zeppelin Rush's built-in score is 0 to 3 stars, which is too coarse to drive evolution: two losing games both score zero, so selection can't choose between them. Before any mutation could help, the fitness function had to tell 'lost in 20 seconds' from 'nearly won', and 'barely won' from 'three-star finish'.",
  approach:
    "**Fitness.** Use time remaining on win (0 to 600, higher is better) instead of the 0/1/2/3 star bands. Losses map to a large negative. Every game now gets a different score, running from 'lost slowly' through 'barely won' to 'three-star finish', so selection always has something to choose.\n\n{{code:fitness}}\n\n**I/O.** The game was mouse-driven. I remapped its inputs onto keyboard keys (T, R, S/M/L, H/A/Q, Z/X/C) and drove it from Python via the `keyboard` library. Keystrokes are faster and more reliable than screen-grabbing coordinates. Data comes back through `SharedData.json`: the engine writes gold/gamestate/timer continuously, the Python side polls. Shared memory would have meant rewriting too much of the engine's gameplay code. Windows file locking handled synchronization: if a read landed mid-write, the `IOError` was caught, the Python code slept a millisecond, and retried.\n\n{{code:sharedata-read}}\n\n**Repair pass.** Mutation and crossover regularly produce illegal sequences (selecting the same zeppelin twice in a row, upgrading past the two-upgrade cap). `FixMutation` walks the action list and rewrites each illegal move into a random spawn, so every game the GA plays is legal and no generations are wasted on dead moves.\n\n{{code:fixmutation}}\n\n**Outer loop.** 60 randomly-played starting games, then 16 evolution steps. Each step selects the top 4 by fitness, runs single-point crossover on the top pair, applies 8-action-flip mutations to the best individuals, plays every new individual in-game, and carries the top 4 through unchanged (elitism), so the best run so far is never lost.\n\n{{code:crossover-mutation}}",
  stackRationale: [
    {
      tech: "Python + `keyboard` library",
      why: "Injecting keystrokes was simpler and more reliable than screen-grabbing and mouse simulation. The engine got a one-time keyboard remap, and after that the GA didn't depend on engine internals.",
    },
    {
      tech: "SharedData.json + Windows file locking",
      why: "Shared memory would have meant a large engine refactor. A JSON file plus a `try/except IOError` let the OS file lock handle synchronization, and gameplay code stayed as it was.",
    },
    {
      tech: "FixMutation (constraint-aware repair)",
      why: "Mutation and crossover regularly produce illegal sequences (double-select, over-upgrade). The repair pass rewrites them into legal moves, so every game the GA plays is legal.",
    },
    {
      tech: "Elitism (top 4 carried unchanged)",
      why: "Keeps the best games even if all their offspring mutate into something worse, so the best score never drops.",
    },
    {
      tech: "Mayhem Engine (C++, built with my team)",
      why: "Because we wrote the engine, I could add the keyboard remap and the JSON output on the game side directly.",
    },
  ],
  highlights: [
    "Best game: 401, crossing the three-star threshold of 400. I've done that myself once.",
    "60 random starts, 16 generations, about 24 hours of compute.",
    "Continuous time-remaining fitness (0 to 600) instead of 0 to 3 stars, which gave selection something to choose between.",
    "FixMutation repair keeps every evaluated individual playable. Illegal moves get rewritten to legal ones before fitness runs.",
    "JSON IPC with Windows file-lock retry, with no gameplay refactor.",
    "Per-generation JSON output: any specific game can be replayed in-engine, and the scatter plot rebuilt straight from the files.",
    "Built before AI coding assistants were useful. I worked out the fitness design, the IPC approach, and the repair pass myself.",
  ],
  figures: [
    {
      diagram: "ga-scatter",
      alt: "Interactive scatter plot of every game the genetic AI played. X axis: generation (0 to 16). Y axis: score in seconds remaining (−99 sentinel = loss). Hover any dot to see the exact score. A cyan trend line connects the best winning score of each generation, rising from 306 at gen 0 through the 400-point three-star threshold and topping out at 401.85 by gen 15.",
      caption:
        "Fitness by generation. Each dot is one game; hover for the exact score. The cyan line is the best win of each generation, and the amber line at 400 is the three-star threshold.",
    },
    {
      src: "/projects/zeppelin-rush/data-layout.png",
      alt: "Three-panel view of the on-disk outputs. Left: Best_Game.json showing the winning action sequence and the final score of 401.84. Middle: the Games folder containing GameEvolution_1.json through GameEvolution_16.json plus OrigionalGames. Right: OrigionalGames.json mapping each of the 60 starting games to its finishing time.",
      caption:
        "The three on-disk outputs. Left: the winning action sequence, ending at 401.84. Middle: a JSON per generation, each holding the full action list for every game so any run can be replayed in the engine. Right: the times-only counterpart. The Games(TimesOnly) folder writes one of these per generation with just the finishing times, for quick analysis without loading full action lists.",
    },
  ],
  codeSnippets: [
    {
      id: "fitness",
      title: "Fitness: time remaining on win, negative on loss",
      description:
        "0 to 3 stars is too coarse: two losing games both score zero, so selection has nothing to choose. Time remaining gives every game a different score, running from 'lost slowly' through 'barely won' to 'three-star finish'.",
      language: "python",
      code: `def fitness(game_result: dict) -> float:
    """
    game_result is parsed from SharedData.json after the game ends.
    Winning is rewarded by how much time was left (0..600 seconds).
    Losing is a large negative so the GA always prefers any win over
    any loss, but still gradients between 'lost fast' and 'lost slow'.
    """
    timer = game_result["Timer"]       # seconds left when game ended
    state = game_result["Gamestate"]   # "Win" or "Lose"
    if state == "Win":
        return timer                   # higher = finished faster
    return -600.0 + timer              # still a gradient between losses`,
    },
    {
      id: "fixmutation",
      title: "FixMutation: constraint-aware repair of illegal sequences",
      description:
        "Mutation and crossover regularly produce sequences that break the game's rules (selecting the same zeppelin twice in a row, upgrading a stat past the two-upgrade cap). The repair pass rewrites each illegal move into a random legal spawn, so every game the GA plays is legal.",
      language: "python",
      code: `SELECT  = {"S", "M", "L"}
UPGRADE = {"H": "health", "A": "attack", "Q": "speed"}
SPAWNS  = ["Z", "X", "C"]   # top / middle / bottom lane

def FixMutation(actions):
    fixed = []
    selected = "S"                                   # small by default
    upgrades = {z: {"health": 0, "attack": 0, "speed": 0}
                for z in SELECT}

    for a in actions:
        if a in SELECT:
            # Illegal: two selects in a row. The previous select was
            # pointless, so replace THIS one with a random spawn.
            if fixed and fixed[-1] in SELECT:
                fixed.append(random.choice(SPAWNS)); continue
            selected = a
            fixed.append(a)
        elif a in UPGRADE:
            stat = UPGRADE[a]
            # Illegal: upgrading past the 2-upgrade cap.
            if upgrades[selected][stat] >= 2:
                fixed.append(random.choice(SPAWNS)); continue
            upgrades[selected][stat] += 1
            fixed.append(a)
        else:
            fixed.append(a)
    return fixed`,
    },
    {
      id: "crossover-mutation",
      title: "Crossover + mutation on action lists",
      description:
        "Each genome is the action list the AI fed into the game. Single-point crossover splices two parents at a random index. Mutation flips 8 positions uniformly. Illegal tails from either op are repaired by FixMutation before evaluation.",
      language: "python",
      code: `ACTIONS = ["M", "L", "H", "A", "Q", "Z", "X", "C"]

def crossover(p1, p2):
    idx = random.randrange(1, min(len(p1), len(p2)))
    child1 = p1[:idx] + p2[idx:]
    child2 = p2[:idx] + p1[idx:]
    return FixMutation(child1), FixMutation(child2)

def mutate(genome, flips: int = 8):
    g = list(genome)
    for _ in range(flips):
        i = random.randrange(len(g))
        g[i] = random.choice(ACTIONS)
    return FixMutation(g)`,
    },
    {
      id: "sharedata-read",
      title: "SharedData.json read loop with Windows file-lock retry",
      description:
        "The engine writes gamestate/gold/timer to SharedData.json every frame. The Python side polls. If a read lands mid-write, Windows file-locking raises IOError, the catch block waits a millisecond, and retries. Shared memory would have meant a big engine refactor. This took an afternoon.",
      language: "python",
      code: `def read_game_state(path="SharedData.json", max_retries=50):
    for _ in range(max_retries):
        try:
            with open(path, "r") as f:
                return json.load(f)["GameInfo"]
        except (IOError, json.JSONDecodeError):
            # Engine is mid-write. Back off one tick and retry.
            time.sleep(0.001)
    raise RuntimeError("SharedData.json never settled")`,
    },
  ],
};
