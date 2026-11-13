# Gameplay Style Reference: Ragdoll Puppet Fighter

## 1. Overview & Core Philosophy
The reference game (*Puppet Fighter 2 Player*) is built around fast, physics-driven, and intentionally comical ragdoll party combat. Instead of complex fighting-game combo inputs, gameplay centers on intuitive momentum, loose physical articulation, and high-impact tactile reactions where positioning, timing, and ring-out hazards govern every encounter.

---

## 2. Controls
- **Core Input Layout:**
  - Movement: Left and Right directional inputs for running and repositioning.
  - Jump: Single tap or hold for vertical hops and aerial leaping over lunges.
  - Punch / Primary Attack: Single action button to strike forward, delivering immediate physical impulse to opponent limbs and torso.
  - Block / Defensive Guard: Hold to raise guard, dampening incoming strike momentum and neutralizing stuns.
  - Dash / Agility Burst: Optional high-speed burst to close distances or perform evasive retreat.
- **Input Philosophy:**
  - Fast response with zero pre-rendered lag; button presses directly manipulate physical torques and directional impulses on the character's articulated joints.

---

## 3. Attack & Hit Mechanics
- **Punch Dynamics:**
  - Attacks execute with a rapid wind-up (~0.08 s), a sharp active hit frame window (~0.12 s), and a brief recovery window.
  - Strikes carry directional force vector derived from fighter momentum, facing direction, and relative torso positioning.
- **Damage & Knockback Scaling:**
  - Rather than static health depletion, attacks accumulate dynamic damage points (0% to 100%+).
  - Higher damage progressively scales the knockback multiplier applied to subsequent hits, turning late-round strikes into dramatic arena launches.
- **Block & Guard Mechanics:**
  - Active blocking positions the puppet's forearms in a protective posture.
  - Well-timed blocks absorb ~75% of incoming strike impulse and completely prevent hit-stun, allowing immediate counter-offense.

---

## 4. Ragdoll Reactions & Visual Comedic Physics
- **Limb Flopping & Stagger:**
  - Upon taking an unblocked punch, the puppet's neck and limb constraints briefly loosen, causing the head to snap back and the limbs to flail outward in exaggerated, funny motions.
  - Heavy strikes destabilize the puppet's upright balance controller, causing a 0.4–0.6 s stagger recovery where the fighter stumbles before regaining full footing.
- **Impact Feedback:**
  - Solid hits produce immediate particle bursts, screen micro-shake, and an authentic 50 ms hit-stop freeze frame that accentuates physical weight.

---

## 5. Round Structure, Length & Win Conditions
- **Brisk Round Pacing:**
  - Individual rounds are snappy and thrilling, typically running ~60 seconds.
  - Rounds frequently conclude early via sudden knockouts, ring-outs, or arena boundary departures.
- **Match Format:**
  - Best-of-3 rounds is the ideal competitive format (first to 2 round victories claims the match crown).
  - Preserves customizer match duration options (60s, 90s, 120s, 180s) for varied playstyles.
- **Round Resolution:**
  - Ring-out / Fall: Falling into hazard pits or getting blasted out of the arena bounds instantly awards the round to the survivor.
  - Time Expiration: If the clock runs out, the fighter with the lower accumulated damage (or highest mode score) wins the round.

---

## 6. Camera Behavior
- **Dynamic Spring Camera:**
  - Auto-frames both combatants using a spring-damped centroid tracker.
  - Zooms in closely (~1.3x–1.5x) when fighters are engaged in close-quarters brawling, magnifying impacts and arm clashes.
  - Smoothly expands to wider perspective (~0.75x–1.0x) as fighters separate or get launched across the arena.
  - Features short zoom-punches and directional screenshake on heavy impacts.

---

## 7. Stage Design & Hazard Integration
- **Arena Readability:**
  - Compact, symmetrical stages with clear raised platform edges, distinct floor boundaries, and intuitive drops.
  - High-contrast visual cues delineate solid walkable terrain from open hazard edges.
- **Integrated Environmental Hazards:**
  - Maps feature 1 to 2 distinct, readable environmental mechanics (such as industrial jump bouncers, rising thermal drafts, or hazard pits) that reward ring-control and positional displacement without overshadowing hand-to-hand combat.

---

## 8. Mobile Control Ergonomics
- **Dual-Thumb Layout:**
  - Left Zone: Large, touch-friendly Left and Right movement controls with slide-between drag support.
  - Right Zone: Dominant, primary action buttons (Jump and Punch) sized $\ge 64\text{ px}$ for reliable rapid tapping.
  - Secondary Anchors: Block and Dash positioned in accessible secondary touch slots within natural thumb arcs.
  - Strict compliance with screen safe areas (`env(safe-area-inset-*)`) and confinement to the bottom 40% of the screen so health meters, round pips, and fight action remain unobstructed.
