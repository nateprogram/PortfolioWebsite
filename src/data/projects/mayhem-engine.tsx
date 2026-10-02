// Deep-dive content for /projects/mayhem-engine.

import type { ProjectDetail } from "../types";

export const mayhemEngine: ProjectDetail = {
  problem:
    "Building a C++ game engine from scratch and shipping a game on it is usually a 5-to-6 programmer job. We had 3. On top of that, the designers on the team didn't deliver on their scope, so the programmers picked up tuning, level flow, and encounter pacing too. So the biggest risk was anything the rest of the team couldn't change on their own: every tweak that needed a programmer cost time we didn't have.",
  approach:
    "**Particle system.** An emitter-component model: every visual effect in the game (explosions, muzzle flash, death puffs, pickup sparkles) is an `Emitter` component owning a pool of particles, a JSON config, and a behavior. `ParticleSystem.cpp/h` (~840 LOC) runs the update loop; four emitter behaviors (`BehaviorEmitterTest`, `BehaviorEmitterKey`, `BehaviorEmitterDeath`, `BehaviorEmitterExplosion`, ~420 LOC together) specialize when and why an emitter fires. Every tunable field lives in JSON:\n\n{{code:emitter-json}}\n\nWhat each field does:\n\n- **PatternType**: `Rotate` spawns particles around the emitter's origin at sweeping angles, so a muzzle flash fans out. A directional vector spawns along that vector, so a thruster plume goes one way.\n- **SpawnRate**: particles per second. The emitter keeps an accumulator and spawns whole particles on frames where the fractional part tips over 1.\n- **ParticleLife**: seconds each particle lives. On spawn, age starts at 0; when age hits ParticleLife, the slot returns to the pool's free list.\n- **SprayAngle**: half-angle cone (degrees) around the pattern direction. Each particle's launch vector is rotated by a uniform random value in [-SprayAngle, +SprayAngle].\n- **MinSpeed / MaxSpeed**: uniform random launch speed along the sprayed direction.\n- **ParticleMoveWithObject**: when true, particles inherit the emitter's transform each frame (good for a trail stuck to a moving zeppelin). When false, particles live in world space (good for an explosion that stays where it detonated).\n- **HiveMind**: when true, every particle in the emitter advances its animation frame in lockstep. When false, each particle animates on its own age.\n- **UniformAnimation**: when true, all particles use the same sprite sheet. When false, each particle can pick from a set for visual variety.\n- **Fade**: `Out` fades alpha from 1 to 0 over the final `FadeTime` seconds of life. `In` fades 0 to 1 over the first `FadeTime` seconds. `None` keeps alpha at 1 the whole time.\n- **ScaleSetting**: `In` scales linearly from 1 up to `ScaleMultiplier` over `ScaleTime` seconds (growth). `Out` scales from `ScaleMultiplier` down to 1 (shrink). `Pop` scales up then back down around `ScaleTime`, which is the 'punch' curve used for impact effects.\n- **Animation**: sprite-sheet flipbook. A particle advances a frame every `FrameDuration` seconds and wraps if looping (else clamps on the last frame).\n\n**How the emitter manages particles.** Each emitter owns a fixed-size particle pool sized at load from `SpawnRate * ParticleLife` so no allocations happen at play time. Per frame the emitter does four things: (1) the spawn accumulator increments by `SpawnRate * dt` and each time it tips over 1 a free slot is pulled from the pool and filled with initial state (position, velocity sampled from spray + speed range, age=0, random animation offset); (2) one pass over the live particles advances age, integrates position by velocity * dt, evaluates the fade and scale curves against the particle's age, and advances the flipbook; (3) any particle whose age exceeds ParticleLife returns to the free list; (4) the render pass batches live particles by sprite source into a single draw call. `BehaviorEmitterKey` is the iteration hook: hold a bound key in-engine and the emitter spawns one particle per frame against the current JSON config, so the loop is 'edit JSON, reload, hold key, watch the difference' with no C++ rebuild.\n\n{{code:particle-update}}\n\n**Stat system.** `Stats.cpp` (587) + `Stats.h` (123): a Component subclass instantiated on every stat-bearing entity (towers, zeppelins, cannons). Serialized fields: MaxHealth, ReloadTime, RespawnRate, AttackDamage, MaxSpeed, Cost. Runtime state tracks live Health, reload/respawn timers, and IsHurt / IsAttacking / IsDead flags. Upgrades are built in: per-level arrays (`MaxHealthLvls`, `MaxSpeedLvls`, `AttackDamageLvls`, `UpgradeCostLvls`) indexed by the entity's current upgrade level. When the UI calls `UpgradeMaxHealth()`, the method bounds-checks against the level cap, charges the player `UpgradeCostLvls[level]`, advances the level, and reads the new MaxHealth out of `MaxHealthLvls[level]`. Designers tune the upgrade curve in JSON without a rebuild.\n\n{{code:stats-h}}\n\n**Input abstraction.** `MEInput.cpp/h` (~241 LOC) wraps GLFW with per-frame edge detection. `PollEvents()` at the top of every frame snapshots current key/mouse state into one array and last frame's state into another; `IsKeyPressed(key)` returns true only on the frame the key transitioned from up to down (current=down, previous=up); `IsKeyHeld` checks current=down; `IsKeyReleased` is the down-to-up transition. Every system polls through it, so menus, gameplay, and debug keys behave the same way each frame, and gameplay code never touches GLFW.\n\n{{code:meinput}}\n\n**Cross-subsystem contributions.** With three programmers, everyone worked across the engine. I worked on rendering, asset loading, gameplay code (`TowerBehavior`, `CannonBehavior`, `BehaviorHealthBar`), and UI wiring alongside the two programmers who were primary owners. When the design work fell through, the programmers took on tuning and level flow too.",
  stackRationale: [
    {
      tech: "C++ with no commercial middleware",
      why: "We wanted to understand the whole engine, so we wrote the rendering, memory pools, and hot paths ourselves. When something crashed, the cause was in our own code.",
    },
    {
      tech: "JSON-serialized emitters (rapidjson)",
      why: "Designers tweak particles constantly. With every emitter parameter in a data file, they iterated in a text editor. Hot reload plus a key that spawns particles live (GLFW_KEY_P) meant we didn't need a custom editor.",
    },
    {
      tech: "Component-based entity model (Stats : public Component)",
      why: "Every entity that had stats got the same component. Serialization, update logic, and upgrade flow live in one place; towers, zeppelins, and cannons just tag themselves by `ObjectType` and inherit the rest.",
    },
    {
      tech: "Per-level upgrade arrays",
      why: "Tower upgrades are the game's main progression. Each stat's level values are an array, so designers tune the upgrade curve by editing JSON. The `Upgrade*` methods bounds-check the level cap, charge the cost from `UpgradeCostLvls[level]`, advance the level, and read the new stat value out of the matching level array. No balancing change needed a rebuild.",
    },
    {
      tech: "Edge-detected input (MEInput)",
      why: "Input logic has to tell \"just pressed this frame\" from \"held since last frame.\" One polling layer gives every caller the same behavior and keeps GLFW out of gameplay code.",
    },
  ],
  highlights: [
    "~3,000 LOC authored across 14+ engine source files.",
    "Particle system: ~1,260 LOC (ParticleSystem.cpp/h plus four emitter behaviors). Stat/upgrade system: ~710 LOC. Input abstraction: ~241 LOC.",
    "Our own code for 6 subsystems: rendering, scene graph, particles, input, asset pipeline, and audio hooks.",
    "rapidjson pipeline: emitter parameters and upgrade curves live in text files and hot-reload without a rebuild.",
    "Shipped Zeppelin Rush to Steam on the engine.",
  ],
  figures: [
    {
      diagram: "particle-playground",
      alt: "Interactive particle emitter driven by an editable Emitter.json",
      caption:
        "Try it: the engine's emitter model, ported to TypeScript. Edit the JSON and the emitter hot-reloads on every keystroke; a broken edit keeps the last good config running. PatternType, SpawnRate, ParticleLife, SprayAngle, Min/MaxSpeed, Fade, and ScaleSetting keep the engine's field names. Direction, Gravity, Drag, Size, and Colors are web-only additions: the engine moves particles at constant velocity and gets its look from sprite sheets, while these are plain glowing dots.",
    },
  ],
  codeSnippets: [
    {
      id: "emitter-json",
      title: "Emitter.json: full data-driven emitter schema",
      description:
        "Every effect in the game is a JSON file like this. The particle system reads it with rapidjson and rebuilds the emitter on each reload, so changing a fade curve takes a save and a key press.",
      language: "json",
      code: `{
  "Emitter": {
    "ParticleMoveWithObject": false,
    "PatternType": "Rotate",
    "SpawnRate": 100,
    "ParticleLife": 3,
    "SprayAngle": 20,
    "MinSpeed": 100,
    "MaxSpeed": 150,
    "HiveMind": false,
    "UniformAnimation": true,
    "Fade": "Out",
    "FadeTime": 0.2,
    "ScaleSetting": "Pop",
    "ScaleMultiplier": 4.0,
    "ScaleTime": 2.9
  },
  "Animation": {
    "FrameCount": 32,
    "FrameDuration": 0.01,
    "IsLooping": true,
    "DiffAnimations": false
  },
  "Sprite": { "SpriteSource": "particlemagic" }
}`,
    },
    {
      id: "particle-update",
      title: "ParticleSystem::Update: the per-frame emitter loop",
      description:
        "Each frame, an emitter spawns from its accumulator, ages and moves its particles, evaluates the curves, advances the flipbook, and recycles dead particles. The pool is sized at load from SpawnRate * ParticleLife, so nothing is allocated during play.",
      language: "cpp",
      code: `void ParticleSystem::Update(float dt)
{
  // 1. Spawn. Accumulator spawns whole particles on frames
  //    where the fractional part tips over 1.
  spawnAcc_ += config_.SpawnRate * dt;
  while (spawnAcc_ >= 1.0f && !pool_.Full())
  {
    Particle* p = pool_.Acquire();
    p->pos       = ResolveSpawnPos(config_);
    p->vel       = SampleLaunchVector(config_);   // spray + speed
    p->age       = 0.0f;
    p->animFrame = config_.HiveMind ? hiveFrame_ : 0;
    spawnAcc_   -= 1.0f;
  }

  // 2. Update every live particle in one pass.
  for (Particle& p : pool_.Alive())
  {
    p.age += dt;
    if (p.age >= config_.ParticleLife) { pool_.Release(p); continue; }

    p.pos  += p.vel * dt;
    p.alpha = EvalFade(config_.Fade, p.age,
                       config_.ParticleLife, config_.FadeTime);
    p.scale = EvalScale(config_.ScaleSetting, p.age,
                        config_.ScaleMultiplier, config_.ScaleTime);

    AdvanceFlipbook(p, anim_, dt);
  }

  if (config_.HiveMind) AdvanceFlipbook(hiveFrame_, anim_, dt);
}`,
    },
    {
      id: "stats-h",
      title: "Stats.h: component interface for any stat-bearing entity",
      description:
        "Every entity with health or damage gets one of these. Serialized fields hold the stats, per-level arrays drive the upgrade curve, and the Upgrade* methods check the level cap, charge the cost, and advance the level.",
      language: "cpp",
      code: `class Stats : public Component
{
public:
  // Serialized design fields (read from JSON).
  int   MaxHealth, ReloadTime, RespawnRate, AttackDamage;
  float MaxSpeed;
  int   Cost;

  // Per-level upgrade curves. [0] is the base stat, [1] first
  // upgrade, [2] second. Designers edit these arrays in JSON.
  std::vector<int>   MaxHealthLvls;
  std::vector<float> MaxSpeedLvls;
  std::vector<int>   AttackDamageLvls;
  std::vector<int>   UpgradeCostLvls;

  // Runtime state.
  int   Health;
  float reloadTimer_, respawnTimer_;
  bool  IsHurt, IsAttacking, IsDead;

  // Upgrade API. Each method bounds-checks against the level cap,
  // charges UpgradeCostLvls[level], advances the level, and reads
  // the new value out of the matching level array. Returns false
  // if already at cap or player can't afford.
  bool UpgradeMaxHealth();
  bool UpgradeMaxSpeed();
  bool UpgradeAttackDamage();

  // Called on JSON (re)load to rebuild the serialized fields.
  void Deserialize(const rapidjson::Value& v) override;
};`,
    },
    {
      id: "meinput",
      title: "MEInput: edge-detected input over GLFW",
      description:
        "One input layer for the whole engine. PollEvents saves this frame's state, and the query methods compare it with the previous frame, so every caller gets the same 'just pressed this frame' check without using GLFW directly.",
      language: "cpp",
      code: `class MEInput
{
public:
  // Call once at the top of every frame.
  static void PollEvents();

  // Edge-detected queries: true only on the frame the key
  // transitioned. No repeat, no autorepeat, no timing surprises.
  static bool IsKeyPressed(int key);    // up -> down this frame
  static bool IsKeyHeld(int key);       // currently down
  static bool IsKeyReleased(int key);   // down -> up this frame

  static bool IsMousePressed(int btn);
  static bool IsMouseHeld(int btn);
  static bool IsMouseReleased(int btn);

  static glm::vec2 MousePos();

private:
  static std::array<bool, MAX_KEYS>  curr_, prev_;
  static std::array<bool, MOUSE_BTNS> currMouse_, prevMouse_;
};`,
    },
  ],
};
