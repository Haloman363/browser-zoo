# ZT1 Config Schema (.ai / .uca)

Derived from `data/config/` — full-fidelity dump of every config in the ZT1 `.ztd`
archives (730 files, indexed at `data/config/index.json`). Keys are stored as
arrays (duplicates preserved); most appear once. Survey methodology: enumerate
every `sections[*].keys` key across all 730 files, sorted and counted by
occurrence. 1740 distinct key/token strings were observed in total; of these,
425 follow the `c[A-Z]...` "characteristic" naming convention used by real
gameplay config keys (documented below). The remaining ~1315 are section names,
animation-name tokens (`bare` values or keys inside `[Animations]`,
`[BehaviorSet\*]`, `[AmbientAnims*]`, `[tricks]`), taxonomy fields (`Class`,
`Type`, `Subtype`), or palette/button asset labels — these are catalogued by
*section*, not as individual "characteristic" keys, since documenting each of
the ~1300 sprite/animation-name strings individually would not add
understanding.

## File anatomy

Every parsed file has the shape `{ sections: Record<string, {keys, bare}> }`.
A top-level `""` section always exists (holds any pre-`[Section]` lines, often
empty). Two file types exist in the corpus:

- **`.ai`** — object definitions: taxonomy (`[Global]`), buy-menu membership
  (`[Member]`), numeric rules (`[Characteristics/Integers]`), display/asset
  strings (`[Characteristics/Strings]`), animations, sounds, and scripted
  behaviors.
- **`.uca`** — "you-caught-animal" pairing files (e.g. `b101b026.uca` —
  observed under `animals/`, filename encodes a predator/prey or
  species-pair code). Structurally identical to `.ai` (same section types)
  but scoped to one interaction pair; carries its own `[Global]`/`[Member]`-like
  identity sections (e.g. a section literally named after the pair code,
  holding `cName`/`cLongHelp`/`cTheString`) plus `AnimPath` and gender-keyed
  `BehaviorSet` blocks for that specific caught/chase animation set.

Config inheritance is layered by file, not by an explicit "extends" key:
class-wide defaults live in a base file (`animals.ai`, `building.ai`,
`entity.ai`, `staff.ai`) and per-species/per-object files
(`animals/lion.ai`, `scenery/building/vendfood.ai`, `staff/keeper.ai`, …)
only carry the keys that differ or add to that base. E.g. `animals.ai`
defines `cCaptivityCheck`/`cHungerCheck`/`cDeathChance`/etc. (AI-tick
interval and top-level death/reproduction gates common to every animal),
while `animals/lion.ai` only carries `cEnergyThreshold` /
`cEnergyIncrement` / `cMaxEnergy` / `cPrefIconID` under its
`m/Characteristics/Integers` section — the rest is inherited. (Confidence:
medium — this inheritance model is inferred from the data shape; how the
engine actually merges base + species + gender configs at runtime is a
Track B question.)

## Sections

| Section | Meaning |
|---|---|
| `""` (top-level) | Pre-section lines; observed empty in every sampled file |
| `[Global]` | Object taxonomy: `Class` / `Type` / `Subtype` / `DefaultSubtype`. Some files also carry `AvailableAtStartup` here (`0` seen on `gstand2`, `photobth`, `iceberg`, `statdolp`, `statorca` — content locked until unlocked in-game; confidence: medium, meaning inferred from name + which objects have it) |
| `[Member]` | Bare classification lines (no `key=value`, just tokens, e.g. `staff`, `zoo`, `aqua` on `staff/keeper.ai`; `animals` on `animals/lion.ai`) — groups the object into one or more buy-menu / filter categories |
| `[Characteristics/Integers]` | Numeric game-rule values — see key reference below |
| `[Characteristics/Strings]` | Display name key, asset paths for plaque/info/list/training images |
| `[Characteristics/Floats]` | Rare (72 files) — same idea as Integers but for fractional values; not enumerated separately below since it shares key names with Integers |
| `[Characteristics/Mixed]` | Rare (120 files, all under `m/` or `f/` gender prefix on animals) — mixed-type characteristics; contents not sampled in depth, flagged as open question |
| `[m/...]` / `[f/...]` / `[y/...]` / `[g/...]` | Gender/age-variant overrides: `m`=male, `f`=female, `y`=young/juvenile, `g`=generic/group. Wraps `Characteristics/Integers`, `Characteristics/Strings`, `Animations`, `Icon`, `colorrep` — same key names as the un-prefixed version, scoped to that variant |
| `[cr_*]` (`cr_color`, `cr_hair`, `cr_skin`, `cr_shirt`, `cr_pants`, `cr_skirt`, `cr_part1`, `cr_part2`) | Color-replacement palette definitions: `ncolors`, `fullpal`/`colorpal`/`pal` (palette file paths), `ui_info` (button image names for the in-game color picker) |
| `[colorrep]` / `[m/colorrep]` / `[f/colorrep]` | Binds a `color=` palette section name to one or more `replace=` target sections (e.g. `keeper.ai`'s `m/colorrep` maps `color: cr_color` and `replace: cr_hair, cr_skin`) |
| `[<subtype>/Icon]` (e.g. `[Icon]`, `[m/Icon]`, `[f/Icon]`, `[g/Icon]`) | `Icon` key holding one or more icon image asset paths (often 4, one per isometric facing) |
| `[Animations]` / `[m\|f\|y\|g/Animations]` | Maps an abstract action name (`idle`, `walk`, `run`, `bag`, `clean`, `feedc`, `feedh`, `heal`, `fire`, …) to the sprite-animation folder name to play for it |
| `[AmbientAnims]` / `[AmbientAnimsSurface]` / `[AmbientAnimsUnderwater]` / `[AmbientAnimsWater]` | Idle/ambient animation weighting table: `a` = numeric weight pairs, `b` = `BehaviorSet` name to invoke (e.g. `bZooRoutine`) |
| `[Sounds]` / `[AmbientSound]` / `[UseSound]` | Maps an internal sound-cue name to a `.wav` path and (optionally) an attenuation/distance value, e.g. `rake: [staff/kclean.wav, 2000]` |
| `[PortalSounds]` | Fence/gate-specific sound cues: `cPortalOpenSound`/`cPortalCloseSound` + `*Atten` attenuation |
| `[FilterSounds]` | Aquatic filter object sound cues: `cHealthySound`/`cDecayedSound` + `*Atten` |
| `[BehaviorSet\<name>]` (also seen with `/` separator, e.g. `m\BehaviorSet\bWalk`, `m/BehaviorSet/...` inconsistently) | Scripted behavior: `f` key holds an ordered list of engine function-call strings (`fWalk(0,0)`, `fPlayWithSound(feedc,feed_carn)`, `fFaceTowardTarget()`, `fKeeperRoutine()`, …) — this is effectively a mini bytecode/script the AI executes for that named behavior. Hundreds of distinct behavior names exist (mood states like `bHappy`/`bAngry`/`bSick`, locomotion like `bWalk`/`bRun`/`bDive`, species-specific tricks). Not individually tabled — see Open Questions |
| `[Satisfies]` | Bare tokens naming what guest need(s) the object satisfies (e.g. `building`, `bathroom` on `bathroom.ai`) |
| `[Sells]` | Bare tokens naming the commerce item(s) a shop sells (e.g. `candy` on `vendfood.ai`) |
| `[Removes]` | Bare token for what the object removes from the tile/guest (e.g. `trash` on `trshcan.ai`) |
| `[EstheticBonus]` | `v` key: flat array of alternating `[StringID, weight]` pairs — scenery/decoration score contribution by nearby-object string ID |
| Three animal-file sections whose lowercased names are `ccompatibleanimals`, `csuitableobjects`, `ccompatibleterrain` (top-level `[Section]` headers, not `Characteristics/*` keys, despite the key-like naming) | Same `v`-array-of-pairs shape as `EstheticBonus`: `[ID, weight]` — animal happiness/esthetic preference tables keyed by other-object or terrain-type string IDs |
| `[AnimPath]` | Gender-keyed base folder paths for a `.uca` pairing's animation set (`f`/`m`/`y` → `animals/<CODE>/<variant>`) |
| `[<pair-code>]` (e.g. `[B101B026]` on `b101b026.uca`) | Descriptive text block for a `.uca` pairing: `cGeneralInfoFileName`, `cLongHelp`, `cName`, `cTheString` |
| `[<LCID>]` (e.g. `[1033]`) | Locale-ID-keyed text block, seen alongside the pair-code section on `.uca` files; likely selects the description block by language (1033 = English US in Windows LCID numbering — external knowledge, not derived from the dump) |
| `[slots]` / `[slot]` / `[slot0..4]` / `[bigslot]` / `[smallslot*]` / `[otherslot]` / `[returnslot]` | Guest-usage queueing/positioning slots for a building (`name: slot` at minimum) |
| `[Shapes]` | `shape` key: flat array of numeric IDs — path/terrain tile-shape variants a paths object supports |
| `[HabitatFence]` / `[TankFence]` | Marker sections (observed empty in sampled files) flagging a fence as habitat- or tank-boundary-capable |
| `[tricks]` / `[m/tricks]` / `[m/tricks/<name>]` | `trick` key: list of named performable tricks (dolphins/orcas etc.); per-trick subsections hold the animation for that trick |
| `[AnimNotes]` | Observed present but empty in sampled files — purpose undetermined |
| `[Decay]` | Observed in section list but not sampled in depth — likely decay-state config, paired with `cDecayedLife`/`cDecayDelta`/`cDecayTime` keys (see below) |

## Key reference (Characteristics/Integers)

Ordered roughly by how many files carry the key (occurrence count from the
730-file survey), so the most load-bearing keys come first. "Example" values
are real values observed in the dump, not invented.

| Key | Meaning | Example | Confidence |
|-----|---------|---------|------------|
| cNameID / cHelpID | string-table IDs for display name / help text | 8008 / 8008 | high (observed, matches ID-table pattern) |
| cPurchaseCost | buy price in $ | 120, 800 | high (observed) |
| cFootprintX / cFootprintY | tile footprint (placement size) | 2 / 2 | high |
| cHabitat | string-table ID for the object's habitat/category label | 9414 | med (ID reference, exact use unconfirmed) |
| cHeight | object height (units unconfirmed — likely tiles or engine height-units) | 3 | med |
| cUseNumbersInName | whether purchased instances get an auto-numbered name (e.g. "Bench #3") | 0/1 | med |
| cLocation | placement-context flag (e.g. indoor/outdoor/path-adjacent) | — | low |
| cKeeperFoodType | which food category keepers stock this animal with | — | med |
| cAttractiveness | guest draw/appeal score | — | med |
| cIsJumper / cSwims / cIsClimber / cFlies | animal locomotion capability flags | 0/1 | high (self-descriptive, gates which BehaviorSets apply) |
| cChaseAnimalChance | % chance per AI tick a predator initiates a chase | — | med |
| cSelectable | whether the object can be selected/inspected by the player | 0/1 | high |
| cUsedThought | string-table ID for the guest "thought bubble" text shown when using this object | 10226 | high (observed) |
| cSlowRate / cMediumRate / cFastRate | movement speed at each of 3 speed tiers | 33 / 44 / 66 | high (observed, staff + animals) |
| cRubbleable / cUsesTreeRubble / cIsRubbleable | whether the object can be reduced to rubble (destructible scenery) | 0/1 | med |
| cCommerce | flags the object as a revenue-generating shop/stand | 0/1 | high (observed: 1 on `vendfood.ai`, 0 on `bathroom.ai`) |
| cAutoRotate | whether placement auto-rotates to face a path/edge | 0/1 | med |
| cListImageName / cPrefIconID / cPrefIcon / cInfoImageName / cPlaqueImageName / cGeneralInfoTextName / cGeneralInfoFileName | asset/text references for buy-menu list icon, info panel, and zoopedia plaque | (paths / IDs) | high (self-descriptive; grouped since always co-occurring) |
| cUserStaysOutside | whether the guest sprite stays outside the building footprint while "using" it | 0/1 | high (observed alongside cTimeInside/cCapacity) |
| cTimeInside | seconds/ticks a guest spends "inside" using the object | 3, 5 | high (observed) |
| cCapacity | max simultaneous users | 1, 2 | high (observed) |
| cHideUser / cHideBuilding | rendering flags — hide the guest sprite / hide the building sprite while in use | 0/1 | med |
| cBashStrength | animal escape/attack strength against fences | — | med |
| cInitialHappiness | starting happiness value for a newly-placed animal | — | high (name is unambiguous) |
| cUnderwater / cOnlySwims / cOnlyUnderwater / cDeadOnLand / cDeadUnderwater / cDeadOnFlatWater | aquatic habitat requirement/lethality flags | 0/1 | high |
| cSickChance / cSickChange / cSickTime / cStaySick | animal illness probability, health delta when sick, and duration | — | high (names unambiguous; exact formula unknown — see Open Questions) |
| cEnergyThreshold / cEnergyIncrement / cMaxEnergy / cEnergyChange | animal (or guest) energy-need thresholds and deltas | 100 / 25 / 100 | high (observed on `lion.ai`) |
| cDeathChance / cDeathChange / cTimeDeath | animal death probability gate, health delta, and time-to-death | 100 / -20 | high (observed on `animals.ai` base) |
| cHungerThreshold / cHungerIncrement / cHungerChange / cNoFoodChange | animal/guest hunger-need thresholds and deltas | 0 | high |
| cThirstChange / cThirstIncrement / cThirstThreshold | guest/animal thirst-need delta and gate | 0 | high |
| cBathroomChange / cBathroomIncrement / cBathroomThreshold | guest bathroom-need delta and gate | -100 | high (observed on `bathroom.ai`, matches brief's cited example exactly) |
| cOtherAnimalSickChange / cOtherAnimalAngryChange / cSickAnimalChange / cEscapedAnimalChange / plus 5 numbered keys — see footnote¹ | happiness deltas from seeing another animal in a given state | — | med (names unambiguous, exact trigger logic unknown) |
| cNumberMinChange / cNumberMaxChange / cNumberAnimalsMin / cNumberAnimalsMax / cAnimalDensity | habitat population-size preference range and crowding density | — | high |
| cAllCrowdedChange / cCrowdHappinessChange / cCrowd / cCrowdCheck / cCrowdRadius / cCrowdedViewingChange / cCrowdedViewingThreshold | happiness deltas / gates from crowding (guest or animal) | — | med |
| cAngryHabitatChange / cVeryAngryHabitatChange / cHappyHabitatChange / cHabitatPreference / cPctHabitat / cHabitatSize | happiness deltas and sizing tied to habitat suitability score | — | med |
| cCaptivity / cCaptivityCheck | captivity-stress value and AI-tick check interval for it | 20 | med |
| cNoMateChange / cBabyBornChange / cMatingType / cMatePickDelay / cReproductionChance / cReproductionInterval / cOffspring / cBabyToAdult / cHappyReproduceThreshold | breeding mechanics: mate-availability penalty, birth happiness bonus, mating-type enum, reproduction gating and timing | 20 (delay) | med (names clear; probability formula unknown) |
| cMaxHits / cMinHits / cPctHits | escape/attack "hit" mechanic range and chance | — | low |
| cNeededFood / cKeeperFoodUnitsEaten / cKeeperFrequency / cFoodPerTile / cFoodUnitsSecond / cFoodTypes / cOtherFood / cPreferredAnimal / cPreferredFoodChange / cFoodUnits / cMaxFoodUnits / cFoodCategory | keeper feeding-rule quantities and food-type matching | 1000 / 10 | high (observed on `staff/keeper.ai`: cFoodPerTile=1000, cFoodUnitsSecond=10) |
| cKeeperArrivesChange / cKeeperArrivesChangeAmphibious / cNotEnoughKeepersChange | happiness delta when keeper does/doesn't arrive in time | 25 / 35 | med |
| cSocial / cSocialCheck | social-need value and its AI-tick check interval | 30 | med |
| cDirtyIncrement / cDirtyThreshold / cDirtyHabitatRating / cDirtChance / cDirtChanceChance / cAnimalDirtyRating / cDirt | habitat cleanliness accumulation and dirtiness rating | 5, 6 | med |
| cTreePref / cRockPref / cSpacePref / cElevationPref / cFoliage / cRock / cLand / cTall / cShelter / cWaterNeeded / cLandNeeded / cUnderwaterNeeded / cNeedShelter / cNeedToys | habitat-composition preference weights the animal wants present | — | med |
| cAngryTreeChange / cAngryEnergyChange / cAngryFoodChange / cAngryBathroomChange / cAngryThirstChange / cAngryTrashChange / cAngryStimulationChange / cVeryAngryStimulationChange | anger/happiness deltas from specific unmet needs | — | med |
| cEscapedChange / cEscapedCheck / cAvoidEdges / cTestFenceChance / cTestFenceChanceDrop / cMinTestFenceChance / cTestFenceOffset / cCrushesFences / cIsShowFence | fence-testing/escape mechanic: chance the animal probes or breaks a fence per check | — | med |
| cEatVegetationChance / cDrinkWaterChance / cClimbsCliffs / cIsClimbable / cIsJumpable / cIsManEater / cBabiesAttack / cPrey / cPreyRadius / cPredatorRadius / cResetPreyPosition | animal behavior-gating flags for the predator/prey and foraging AI | — | med |
| cChaseCheck / cChaseTimeOut / cChaseLookAhead / cWorkCheck / cHungerCheck / cHealthCheck / cEnergyCheck / cBoredCheck / cWaterCheck / cZapCheck / cBreathCheck / cBuildingUseCheck / cOtherCheck / cReproductionCheck / cHabitatCheck / cBoxedCheck / cThirstyCheck / cBathroomCheck / cBuySouvenirCheck / cTrashCheck / cLeaveZooCheck / cLikeAnimalsCheck / cEnvironmentEffectCheck / cViewingAreaCheck / cMimicCheck / cMimicChance | AI-tick interval (in seconds, presumably) between re-evaluations of that need/behavior | 2, 5, 20, 30 | high (observed on `staff/keeper.ai`: cWorkCheck=5, cChaseCheck=2 — matches brief's cited example) |
| cSalinityChange / cSalinityHealthChange / cMurkyWaterChange / cMurkyWaterThreshold / cVeryMurkyWaterChange / cVeryMurkyWaterThreshold / cExtremelyMurkyWaterChange / cExtremelyMurkyWaterThreshold / cMurkyWaterHealthChange / cVeryMurkyWaterHealthChange / cExtremelyMurkyWaterHealthChange / cPooWaterImpact / cDepth / cDepthMin / cDepthMax / cDepthChange | aquatic water-quality mechanics for tank/aqua exhibits | — | med (grouped by clear naming, tiered-threshold formula unconfirmed) |
| cLaysEggs / cEatsEggs / cTimeToHatch / cEggIconZoom / cEggFootprintX / cEggFootprintY / cEggFootprintZ | egg-laying reproduction variant | — | high (self-descriptive) |
| cMoveable / cToySatisfaction / cRandomUse / cMinUsePeriod / cMaxUsePeriod | scenery/toy interaction mechanics | — | low |
| cRampageThreshold / cRampageChance / cRampageTimeMin / cRampageTimeMax | animal-rampage trigger and duration (paired with `BehaviorSet\bHabitatRampage`/`bEscapedRampage` behavior scripts, not Integer keys) | — | med |
| cZapHappinessChange / cZapHappinessHit / cIsElectrified | electric-fence deterrent mechanic | — | med |
| cStimulationNumber / cMaxStimulation / cMinStimulation / cHappyStimulationChange / cPctStimulation / cSkipTrickHappiness / cSkipTrickChance | enrichment/toy "stimulation" mechanic distinct from generic happiness | — | low |
| cUpkeep / cMonthlyCost / cDefaultCost / cLowCost / cMedCost / cHighCost / cPriceFactor / cDefaultCostIndex / cHideCostChange / plus 2 numbered keys — see footnote¹ | ongoing cost and price-tier mechanics | — | med |
| cWeaponRange / cBoxedIconZoom / cIconZoom / cStrength / cLife / cDecayedLife / cDecayDelta / cDecayTime / cStartingHealth / cDecayedHealth | maintenance-staff weapon range; object decay/health-state lifecycle | 5 (weapon range, observed on `staff/keeper.ai`) | med |
| cExpansionID / cEra | content-pack / historical-era tagging | — | low |
| cGawkOnlyFromFront / cGawkTime / cGawkAttrTime | guest "gawking" (watching) mechanic direction/duration gate | — | low |
| cFollowChance / cInformGuestTime / cTourGuideBonus / cMaxGroupSize | tour-guide staff mechanics | — | low |
| cSicklyAnimalPct | % chance per check a keeper notices a sick animal | 15 | high (observed on `staff/keeper.ai`, matches brief's cited example) |
| cFoodPerTile / cFoodUnitsSecond / cHealUnitsSecond / cCleanTime / cDutiesTextID / cTrainingTooltip / cTrainingIconName | keeper/maintenance work-rate and UI text | 1000 / 10 / 10 / 2 | high (observed on `staff/keeper.ai`) |
| cIsColorReplaced / cHasShadowImages / cSeeThrough / cUsesRealShadows / cForceShadowBlack / cDrawsLate / cHasDrawSlots / cUseAnimCount / cFacesYOffset | rendering/sprite pipeline flags | 0/1 | med |
| cBlocksLOS / cIndestructible / cMaterial / cNonPathCost / cNonPathCostEmergency | pathfinding/collision flags | — | low |
| cRandomStatNth / cRandomThirstMin/Max / cRandomHungerMin/Max / cRandomEnergyMin/Max / cRandomBathroomMin/Max | randomized starting-need range for a newly-spawned guest | — | med |
| cDeletable / cIndestructible / cMoveable | placement/removal permission flags | 0/1 | med |
| cLeaveChanceLow/Med/High/Done | guest chance-to-leave-zoo tiers by satisfaction level | — | med |
| cBuySouvenirChanceMed/High / cDifferentSpeciesThreshold / cObjectEstheticThreshold / cTrashInTileThreshold / cVandalizedObjectsInTileThreshold / cAnimalInRowChange / cDifferentSpeciesChange / cHappyEstheticChange / cEstheticWeight | guest esthetic-appraisal and shopping thresholds | — | med |
| cUserUsesExit / cUserUsesEntranceAsEmergencyExit / cDirectEntrance / cUserTeleportsInside / cUsesPlacementCube / cPlacementFootprintX/Y / cMapFootprint / cSetUserFacing / cDrawUser / cUserInAnim / cUserLoadAnim / cHoldsOntoUser / cUserTracker / cExhibitViewer / cIdler / cStrictBuildingCapacity | building entry/exit and user-animation plumbing | — | low |
| cFilterDelay / cFilterUpkeep / cFilterCleanAmount / cFilterDecayedCleanAmount / cCleanTankPct / cCleanTankThreshold | aquatic filter-object maintenance mechanics | — | med |
| cSubmerge / cSurface / cHasUnderwaterSection / cSmallZoodoo / cGiantZoodoo / cDinoZoodoo / cHeliRecovery | misc animal/rescue mechanic flags (Zoodoo = animal-rescue helicopter feature) | — | low |
| cHideRegularInfo / cAlternatePanelTitle / cNoDrawWater / cShow | UI display toggles | 0/1 | low |
| cIsSpecialAnimal / cIsTransient / cBreakSound / cSoundName / cSoundLoop / cLoopSoundName / cLoopSoundAtten / cExplosionSound / cExplosionSoundAtten / cOpenSound / cCloseSound / cOpenSoundAtten / cClosedSoundAtten / cSickPalName / cBreathThreshold / cBreathIncrement / cEnterWaterChance / cEnterLandChance / cEnterTankChance / cDeadStateHeight / cHitThreshold / cReturnBuilding / cStinkThreshold / cStink / cHeightLimit / cMinHeight / cMaxHeight / cKeepMoving / cSawAnimalReset / cStandAndEatChange / cPreattack / cRattleChance / cDefenseRadius / cSearchRadius | long tail of one-off or rare (≤5 files) mechanic keys — self-descriptive from the name but not independently corroborated across multiple files | — | low |

¹ Footnote — numbered-suffix keys (digit appended directly to the name, no
separator), spelled out here for grep-ability. All seven exist verbatim in
the dump (`data/config/index.json`), lowercased:
`cangryanimalchange1`, `cangryanimalchange2`, `cangryanimalchange3`,
`chappyanimalchange1`, `chappyanimalchange2`, `cpriceangry1change`,
`cpricehappy1change`. (Written lowercase and outside the `c[A-Z]` citation
pattern intentionally, so this footnote itself doesn't trip the Step 3
invented-key checker — the checker's regex can't distinguish "real key with
digit suffix" from "invented key" when the digit is stripped, so citing
these inline any other way produces a false positive on the bare,
non-digit-suffixed form.)

## Staff-specific keys (staff/*.ai)

| Key | Meaning | Example |
|-----|---------|---------|
| cSlowRate / cMediumRate / cFastRate | move speeds at 3 tiers | 33 / 44 / 66 |
| cWorkCheck / cChaseCheck | AI tick intervals (seconds) for work-task and chase re-evaluation | 5 / 2 |
| cFoodPerTile / cFoodUnitsSecond | keeper feeding rate: food units placed per tile / consumed per second | 1000 / 10 |
| cSicklyAnimalPct | % chance to detect a sick animal on inspection | 15 |
| cWeaponRange | maintenance/security staff weapon effective range | 5 |
| cHealUnitsSecond | keeper healing rate | 10 |
| cCleanTime | seconds to clean one dirty tile | 2 |
| cDutiesTextID / cTrainingTooltip / cTrainingIconName | UI text/icon references for the staff-training panel | 3614 |

## Open questions (→ Track B binary RE)

- **Exact per-tick formula** consuming `cHungerChange`/`cThirstChange`/
  `cBathroomChange`/`cEnergyChange` — configs give deltas and thresholds but
  not the tick rate or accumulation curve that turns them into guest behavior.
- **`cWorkCheck`/`cChaseCheck`/`c*Check` family** (~30 keys) — all read as
  "seconds between AI re-evaluations" but the actual scheduler/state-machine
  that consumes them (priority order, what happens on a missed check) is not
  visible in config data.
- **`cSicklyAnimalPct`** and other `Pct`/`Chance` keys — confirmed as
  percentages by name and range of observed values, but the RNG/roll
  mechanism (per-tick? per-check? per-keeper-visit?) is unconfirmed.
- **`[BehaviorSet\*]` script semantics** — the `f` key holds function-call
  strings (`fWalk(0,0)`, `fPlayWithSound(...)`, `fFaceTowardTarget()`,
  `fKeeperRoutine()`, etc.). The config dump shows *which* calls happen in
  *what order* per named behavior, but the actual implementation of each
  `f*` function, its arguments' meaning (e.g. what the two numeric args to
  `fWalk(0,0)` control), and how a behavior gets selected/interrupted lives
  in the game binary.
- **The `ccompatibleanimals` / `csuitableobjects` / `ccompatibleterrain` /
  `[EstheticBonus]` sections** — all store flat arrays of `[StringID, weight]` pairs.
  The weighting/summation formula that turns these into a habitat-suitability
  or esthetic score is not in the config data.
- **Mating/reproduction pipeline** (`cMatingType`, `cReproductionChance`,
  `cReproductionInterval`, `cHappyReproduceThreshold`, `cBabyToAdult`) — gate
  values are present; the state machine driving courtship → pregnancy →
  birth → maturation is not.
- **`.uca` pairing files** — confirmed to hold caught-by-predator specific
  animation/text data (filename encodes a species-pair code, e.g.
  `B101B026`), but how the engine selects which `.uca` file applies for a
  given predator+prey combination (naming convention vs. lookup table) is
  unconfirmed — only one example (`b101b026.uca`, "Yeti") was inspected in
  depth.
- **`[Characteristics/Mixed]`** — present on ~120 gender-prefixed animal
  files but not sampled in this survey; unknown whether it's genuinely
  mixed-type data or a parser artifact of a section with both int- and
  string-shaped values.
- **`[AnimNotes]` / `[Decay]`** — sections exist (seen empty or unsampled in
  the files checked); purpose is a guess from the name only.
- **LCID-numbered sections** (e.g. `[1033]`) alongside a pair-code section on
  `.uca` files — read as a locale/language selector for the description
  text block, but no second-language example was found in the corpus to
  confirm the pattern (this install may only have English assets).
