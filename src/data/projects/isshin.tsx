// Deep-dive content for /projects/isshin.

import type { ProjectDetail } from "../types";

export const isshin: ProjectDetail = {
  problem:
    "A ten-month Unreal Engine 5 production with a 19-person team, building a third-person action combat game. My scope: a pause menu that cleanly suspends a live combat state machine, hitstop freeze frames that feel punchy without desyncing the animation graph, and a helper library that engineers and designers could both call from anywhere.",
  approach:
    "**Pause menu.** Built in C++ and Blueprints: the main pause UI (`GameUI_BP_Pause`), quit-confirm overlay, restart-confirm overlay, settings panel, and the control-panel screens. Wwise integration for pause SFX (hit, button hover, button press). Ties into `CombatActionManager` via an `FTimerHandle activePause` handle, so combat stops ticking while paused and resumes on the same frame.\n\n{{code:pause-handoff}}\n\n**Hitstop.** Frame-counted freeze-on-hit inside `CombatActionManager`. A `bool hitstop_active` flag and an `int hitstop_frame_counter` drive the freeze: on a confirmed hit, `SetHitstop(true)` flips the flag; the manager's tick skips action updates while the counter increments; at the per-action `Hitstop_frames` ceiling, it auto-releases. Per-attack frame counts live on the `FCombatAction` struct so designers can tune feel per move without touching code. Counting animation frames rather than wall-clock seconds keeps freeze duration deterministic across frame-rate spikes.\n\n{{code:hitstop}}\n\n**UHelperFunctions (Blueprint library).** A `UBlueprintFunctionLibrary` exposing four utilities used across the project via `BlueprintCallable`: `FindRotationDegrees` (rotation targeting for combat positioning), `CalculateFrenzyDamage` (frenzy-scaled damage with level-based stat curves), `GetPlayerCharacter` (safe player access from anywhere), and `GetPositionFromRelative` (relative-space positioning). One implementation, called from both C++ combat code and Blueprint event graphs.\n\n{{code:uhelperfunctions}}\n\n**Other work.** I also worked on many other Blueprints and systems during production. The team used Jenkins for automated builds (so designers and artists always had a recent build without waiting on a programmer) and ClickUp for bug tracking.",
  stackRationale: [
    {
      tech: "Unreal Engine 5.2",
      why: "Suited a 19-person team: high-end rendering, a mature animation graph, and Blueprints, which let designers and artists iterate without a C++ rebuild.",
    },
    {
      tech: "Hitstop via frame counter (not wall-clock seconds)",
      why: "Counting animation frames keeps the freeze the same length through frame-rate spikes and matches how animators think about impact frames.",
    },
    {
      tech: "UBlueprintFunctionLibrary for helpers",
      why: "Designers and engineers both needed the same utilities. A Blueprint function library exposes the C++ functions to event graphs with no extra glue, so one implementation serves both.",
    },
    {
      tech: "Wwise (audio middleware)",
      why: "Gave the audio engineer event-driven sound, dynamic mixing, and a proper authoring tool. Each pause-menu sound is a one-line `AkAudioEvent` reference, with no custom sound manager.",
    },
    {
      tech: "Jenkins + ClickUp",
      why: "Jenkins ran automated builds, so the whole team had a recent build every day without asking a programmer. ClickUp handled bug reports and task triage.",
    },
  ],
  highlights: [
    "Team of 19 (5 engineers, 3 designers, 10 artists, 1 audio engineer) over ten months.",
    "62 C++ files across the Runtime and Editor modules. 107+ Blueprint assets.",
    "Built the pause menu: main UI, quit/restart confirmations, settings panel, Wwise SFX, and pausing the combat state machine via `FTimerHandle activePause`.",
    "Hitstop inside `CombatActionManager`, with per-action frame counts on `FCombatAction`. Designers tune each attack's feel without touching code.",
    "`UHelperFunctions` Blueprint library with 4 utilities (rotation targeting, frenzy damage scaling, player access, relative positioning), callable from C++ and Blueprints.",
    "Wwise audio middleware, Enhanced Input, and CommonUI across the UI stack.",
    "Jenkins for automated builds. ClickUp for bug tracking.",
  ],
  codeSnippets: [
    {
      id: "hitstop",
      title: "Hitstop: frame-counted freeze-on-hit in CombatActionManager",
      description:
        "Counts animation frames instead of seconds, so the freeze stays the same length through frame-rate spikes and matches how animators think about impact frames. Per-action limits live on the FCombatAction struct, so designers tune each move without touching code.",
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
        "Engineers and designers both needed the same utilities. A UBlueprintFunctionLibrary exposes the C++ functions to Blueprint event graphs with no glue, so one implementation serves both. Functions without side effects are BlueprintPure, so they can be called in a graph without an exec pin.",
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
