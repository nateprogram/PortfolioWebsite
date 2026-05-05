// Aggregates each project's deep-dive content into the slug-keyed map
// the /projects/[slug] page reads from. To add a new project's deep
// dive: drop a new file in projects/, import it here, and add one line
// to PROJECT_DETAILS keyed by its slug.

import type { ProjectDetail } from "./types";
import { squadpact } from "./projects/squadpact";
import { stockai } from "./projects/stockai";
import { mayhemEngine } from "./projects/mayhem-engine";
import { zeppelinRush } from "./projects/zeppelin-rush";
import { isshin } from "./projects/isshin";
import { spur2021 } from "./projects/spur-2021";
import { spur2020 } from "./projects/spur-2020";

export const PROJECT_DETAILS: Record<string, ProjectDetail> = {
  squadpact,
  stockai,
  "mayhem-engine": mayhemEngine,
  "zeppelin-rush": zeppelinRush,
  isshin,
  "spur-2021": spur2021,
  "spur-2020": spur2020,
};
