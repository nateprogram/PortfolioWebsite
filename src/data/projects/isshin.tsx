// Deep-dive content for /projects/isshin.

import type { ProjectDetail } from "../types";

export const isshin: ProjectDetail = {
  problem:
    "Ten-month production in Unreal Engine 5 with a 19-person team building a third-person action combat game. The engineering scope was the kind that sounds trivial until you ship it: a pause menu that suspends a live combat state machine cleanly, freeze-frame hits that feel punchy without desyncing the animation graph, and a helper library that both engineers and designers want to call from anywhere without each team reinventing it.",
  approach:
    "**Pause menu.** Owned end-to-end across C++ and Blueprints. Primary pause UI (`GameUI_BP_Pause`), quit-confirm overlay, restart-confirm overlay, settings panel, and the control-panel screens. Wwise integration for pause SFX (hit, button hover, button press). Ties into `CombatActionManager` via an `FTimerHandle activePause` handle, so the combat state machine cleanly suspends action ticks while paused and resumes on the same frame it left.\n\n{{code:pause-handoff}}\n\n**Hitstop.** Frame-counted freeze-on-hit inside `CombatActionManager`. A `bool hitstop_active` flag and an `int hitstop_frame_counter` drive the freeze: on a confirmed hit, `SetHitstop(true)` flips the flag; the manager's tick skips action updates while the counter increments; at the per-action `Hitstop_frames` ceiling, it auto-releases. Per-attack frame counts live on the `FCombatAction` struct so designers can tune feel per move without touching code. Counting animation frames rather than wall-clock seconds keeps freeze duration deterministic across frame-rate spikes.\n\n{{code:hitstop}}\n\n**UHelperFunctions (Blueprint library).** A `UBlueprintFunctionLibrary` exposing four heavily-used utilities via `BlueprintCallable`: `FindRotationDegrees` (rotation targeting for combat positioning), `CalculateFrenzyDamage` (frenzy-scaled damage with level-based stat curves), `GetPlayerCharacter` (safe player access from anywhere), and `GetPositionFromRelative` (relative-space positioning). One implementation, called from both C++ combat code and Blueprint event graphs.\n\n{{code:uhelperfunctions}}\n\n**Cross-team plumbing.** Touched many other Blueprints and systems across the full production. Beyond code: Jenkins for automated builds (so designers and artists always had a recent runnable build without waiting on a programmer), and ClickUp for bug tracking, which is the same shape as Asana (what most studios use).",
  stackRationale: [
    {
      tech: "Unreal Engine 5.2",
      why: "The right tool for a 19-person team: AAA-style rendering, a mature animation graph, and a Blueprint layer that lets designers and artists iterate without waiting on a C++ rebuild.",
    },
    {
      tech: "Hitstop via frame counter (not wall-clock seconds)",
      why: "Combat feel is frame-deterministic. Counting animation frames keeps freeze duration locked across frame-rate spikes and matches how animators think about impact frames.",
    },
    {
      tech: "UBlueprintFunctionLibrary for helpers",
      why: "Designers and engineers both needed the same utilities. A Blueprint function library exposes the C++ surface to event graphs with no extra glue, so one implementation serves both worlds.",
    },
    {
      tech: "Wwise (audio middleware)",
      why: "Audio-engineer-facing workflow: event-driven sound, dynamic mixing, and a real authoring tool. Pause-menu SFX wiring becomes a one-line `AkAudioEvent` reference instead of a custom sound-manager subsystem.",
    },
    {
      tech: "Jenkins + ClickUp",
      why: "Jenkins ran automated builds so the whole team had a recent runnable build every day without asking a programmer for one. ClickUp handled bug reports and task triage in the same shape as Asana, which is what most studios use.",
    },
  ],
  highlights: [
    "Team of 19 (5 engineers, 3 designers, 10 artists, 1 audio engineer) over ten months.",
    "62 C++ files across the Runtime and Editor modules. 107+ Blueprint assets.",
    "Pause menu owned end-to-end: primary UI, quit/restart confirmations, settings panel, Wwise SFX, and clean suspension of the combat state machine via `FTimerHandle activePause`.",
    "Hitstop implemented inside `CombatActionManager` with per-action tunable frame counts on `FCombatAction`. Designers retune combat feel without touching code.",
    "`UHelperFunctions` Blueprint library with 4 widely-used utilities (rotation targeting, frenzy damage scaling, player access, relative positioning). Same surface from C++ and Blueprints.",
    "Wwise audio middleware, Enhanced Input, and CommonUI across the UI stack.",
    "Jenkins for automated builds. ClickUp for bug tracking (Asana-style workflow).",
  ],
  codeSnippets: [
    {
      id: "hitstop",
      title: "Hitstop: frame-counted freeze-on-hit in CombatActionManager",
      description:
        "Counting animation frames, not wall-clock seconds. Freeze duration stays deterministic across frame-rate spikes and matches how animators think about impact frames. Per-action ceilings live on the FCombatAction struct so designers tune feel per move without touching code.",
      language: "cpp",
      code: `// CombatActionManager.h
struct FCombatAction
{
    // ... other fields ...
    int Hitstop_frames = 3;   // per-move ceiling, designer-tunable
};

// CombatActionManager.cpp
void UCombatActionManager::TickComponent(float DeltaTime, ...)
{
    if (hitstop_active)
    {
        // Frozen: skip action ticks, count one frame, auto-release.
        ++hitstop_frame_counter;
        if (hitstop_frame_counter >= CurrentAction.Hitstop_frames)
        {
            SetHitstop(false);
            hitstop_frame_counter = 0;
        }
        return;                    // nothing else runs while frozen
    }
    AdvanceAction(DeltaTime);      // normal path
}

void UCombatActionManager::OnHitConfirmed(const FHitResult& hit)
{
    // Only flip the flag on a confirmed hit; the tick does the rest.
    SetHitstop(true);
    hitstop_frame_counter = 0;
}`,
    },
    {
      id: "pause-handoff",
      title: "Pause menu / combat state-machine handoff",
      description:
        "An FTimerHandle held by the pause subsystem is the suspend token. Pause pauses the handle, freezing combat ticks; resume unpauses and the combat manager picks up on the same frame it left. Widgets drive this via BlueprintCallable wrappers so designers wire it in Blueprint without calling into C++.",
      language: "cpp",
      code: `// GameUI_PauseSubsystem.h
UCLASS()
class UGameUI_PauseSubsystem : public UWorldSubsystem
{
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable) void Pause();
    UFUNCTION(BlueprintCallable) void Resume();

private:
    FTimerHandle activePause;
    TWeakObjectPtr<UCombatActionManager> Combat;
};

// GameUI_PauseSubsystem.cpp
void UGameUI_PauseSubsystem::Pause()
{
    if (Combat.IsValid())
    {
        Combat->SuspendTicks();                           // combat freezes
        GetWorld()->GetTimerManager().PauseTimer(activePause);
    }
    ShowPauseWidget();
}

void UGameUI_PauseSubsystem::Resume()
{
    HidePauseWidget();
    if (Combat.IsValid())
    {
        GetWorld()->GetTimerManager().UnPauseTimer(activePause);
        Combat->ResumeTicks();
    }
}`,
    },
    {
      id: "uhelperfunctions",
      title: "UHelperFunctions: one Blueprint library, four utilities",
      description:
        "Engineers and designers both needed the same utilities. A UBlueprintFunctionLibrary exposes the C++ surface to Blueprint event graphs with no glue, so one implementation serves both worlds. BlueprintPure where the function is side-effect-free so it can be called in-graph without an exec pin.",
      language: "cpp",
      code: `UCLASS()
class UHelperFunctions : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    // Rotation targeting: degrees from Source to Target in the XY plane.
    // Used by combat positioning and camera-relative input mapping.
    UFUNCTION(BlueprintPure, Category = "Isshin|Math")
    static float FindRotationDegrees(FVector Source, FVector Target);

    // Frenzy damage scaling: base damage scaled by the player's
    // current frenzy level using the level-stat curve.
    UFUNCTION(BlueprintPure, Category = "Isshin|Combat")
    static float CalculateFrenzyDamage(int32 BaseDamage, int32 FrenzyLevel);

    // Safe player access from any UObject context.
    UFUNCTION(BlueprintPure, Category = "Isshin|Player",
              meta = (WorldContext = "WorldContextObject"))
    static AIsshinCharacter* GetPlayerCharacter(
        const UObject* WorldContextObject);

    // Relative-space positioning: offset in Source's local frame,
    // returned in world space. Used for attach points and VFX.
    UFUNCTION(BlueprintPure, Category = "Isshin|Math")
    static FVector GetPositionFromRelative(FVector Origin, FRotator Rot,
                                           FVector LocalOffset);
};`,
    },
  ],
};
