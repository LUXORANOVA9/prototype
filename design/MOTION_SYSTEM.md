# LUXOR9 AI LABS: Motion System Architecture

## 1️⃣ Motion Philosophy

### Core Physical Metaphor: "Intelligence Has Mass"
In the Luxor9 ecosystem, data and intelligence are not weightless pixels; they are objects with cognitive density.
*   **High-Value Intelligence (AI Responses):** Moves with deliberate, heavy inertia. It doesn't "pop" in; it *arrives*.
*   **User Input (Commands):** Is swift and sharp, cutting through the noise.
*   **Background Processing:** Is a constant, rhythmic "respiration" of the interface, like a server room's hum visualized.

### Emotional Tone
*   **Premium:** No springy bounces. No cartoony overshoots. Movements are critically damped.
*   **Intentional:** Nothing moves without a cause (user interaction or system state change).
*   **Calm:** High-frequency data updates are smoothed (lerped) to prevent visual jitter.

### Suppression Logic
*   **High Cognitive Load:** When the AI is generating complex output, peripheral motion (background particles, ambient glows) dims and slows to 10% speed to focus user attention.
*   **Error States:** Motion becomes rigid and isometric. No flow; just structural alerts.

---

## 2️⃣ Foundational Motion System

### Duration Scale (The "Luxor Timebase")
We use a logarithmic scale, not linear, to account for perceptual processing time.

| Token | Value | Usage |
| :--- | :--- | :--- |
| `t-instant` | **100ms** | Opacity changes, hover states, color shifts. |
| `t-fast` | **250ms** | Micro-interactions, button presses, small scale changes. |
| `t-base` | **400ms** | Standard panel expansions, card entries. |
| `t-slow` | **600ms** | Full page transitions, large modal entries. |
| `t-deliberate` | **900ms** | AI "Thinking" to "Answer" transitions, complex layout morphs. |
| `t-cinematic` | **1400ms** | Initial app load, signature moments. |

### Easing Curves (The "Luxor Physics")
We reject standard ease-in-out. We use custom cubic-beziers to simulate "magnetic damping".

*   **`ease-luxor-default`** `cubic-bezier(0.25, 0.1, 0.25, 1.0)`
    *   *Why:* Symmetrical but snappy. Used for general UI.
*   **`ease-luxor-entrance`** `cubic-bezier(0.0, 0.0, 0.2, 1.0)`
    *   *Why:* Starts instantly (0 friction), lands softly. For incoming data.
*   **`ease-luxor-exit`** `cubic-bezier(0.4, 0.0, 1.0, 1.0)`
    *   *Why:* Takes a moment to overcome inertia, then accelerates away.
*   **`ease-luxor-depth`** `cubic-bezier(0.1, 0.9, 0.2, 1.0)`
    *   *Why:* The "Lens Focus" effect. Fast approach, extremely slow settle. Used for Z-axis zooms.

### Z-Axis & Depth System
*   **Rest State:** Layer 0 (Background), Layer 1 (Content), Layer 2 (Controls).
*   **Active State:** Active element lifts to Layer 3.
*   **Blur Logic:** `backdrop-filter: blur()` is inversely proportional to Z-depth.
    *   Background: 0px blur.
    *   Layer 1 (Panel): 10px blur.
    *   Layer 3 (Modal): 20px blur + dimming of layers below.

---

## 3️⃣ Core Interaction Animations

### Panel Expansion (The "Unfold")
*   **Duration:** `t-base` (400ms)
*   **Easing:** `ease-luxor-depth`
*   **Transform:** `scale(0.95)` → `scale(1.0)`
*   **Opacity:** `0` → `1` (staggered by 50ms)
*   **Narrative:** The panel doesn't just appear; it steps forward from the background.

### AI Thinking State (The "Synapse")
*   **Duration:** Infinite loop (2000ms cycle)
*   **Easing:** `linear` (for rotation) + `ease-in-out` (for pulse)
*   **Visuals:**
    *   A central core pulses opacity (0.6 → 1.0).
    *   Orbital rings rotate at different speeds (Layer 1: 10s, Layer 2: 15s).
    *   *Crucial:* No "bouncing" dots. Use fluid gradients or rotating strokes.

### Live Data Updates (The "Ticker")
*   **Duration:** `t-fast` (250ms)
*   **Easing:** `ease-out`
*   **Behavior:** Old number slides up (`translateY(-10px)`, `opacity: 0`), New number slides up from below (`translateY(10px)` → `0`, `opacity: 0` → `1`).
*   **Purpose:** Signals data freshness without disrupting layout.

### Error State (The "Glitch")
*   **Duration:** 150ms (x3 shakes)
*   **Easing:** `linear`
*   **Transform:** `translateX(-4px)` → `translateX(4px)`
*   **Color:** Flash `border-red-500` then fade to `border-red-500/50`.
*   **Note:** Keep it tight. Don't shake the whole screen, just the input container.

---

## 4️⃣ Advanced Motion Intelligence

### Stagger Orchestration
Never animate a list as a block.
*   **Rule:** `delay = index * 30ms`.
*   **Cap:** Max delay 300ms (to prevent "waiting" feeling on long lists).
*   **Result:** A "waterfall" of data entry.

### Morphing Components (Layout Shift)
When switching from "Grid View" to "Detail View":
*   **Technique:** `FLIP` (First, Last, Invert, Play).
*   **Shared Element:** The card image/title acts as the anchor.
*   **Background:** Expands from the card's dimensions to fill the screen.
*   **Content:** Fades in *after* the expansion is 60% complete.

---

## 5️⃣ 3D Spatial Layer

### Perspective
*   **Desktop:** `perspective: 1200px` (Flatter, professional).
*   **Mobile:** `perspective: 800px` (More dramatic depth).

### Parallax Strategy
*   **Mouse Move:** Elements shift slightly based on cursor position.
    *   Layer 0 (Bg): `move * 0.02`
    *   Layer 1 (UI): `move * 0.05`
    *   Layer 2 (Floating): `move * 0.10`
*   **Result:** A subtle "window into 3D space" effect.

---

## 6️⃣ Accessibility & Reduced Motion

### Vestibular Safety
*   **If `prefers-reduced-motion: reduce`:**
    *   All `transform: translate/scale` animations are disabled.
    *   Replace with `opacity` fades only.
    *   Parallax is disabled.
    *   Blur transitions are instant.

---

## 7️⃣ Performance Engineering

### GPU-Safe Properties
*   **Allowed:** `transform` (translate, scale, rotate), `opacity`, `filter` (use sparingly).
*   **Forbidden:** `width`, `height`, `top`, `left`, `margin`, `padding` (triggers layout thrashing).

### 60fps Strategy
*   Use `will-change: transform` on active elements *only* during interaction. Remove immediately after.
*   Offload heavy particle systems to WebGL/Canvas (do not use DOM nodes for > 50 particles).

---

## 8️⃣ Signature Cinematic Motion Moment: "The Neural Handshake"

**Trigger:** First successful connection to the Luxor9 AI Core (App Init).

**Sequence:**
1.  **T=0ms:** Screen is deep void black.
2.  **T=200ms:** A single, thin pixel line draws horizontally across the center (`width: 0%` → `100%`, `ease-luxor-entrance`).
3.  **T=800ms:** The line splits vertically, expanding into the main viewport (The "Eye Opening" effect).
4.  **T=1000ms:** As the viewport opens, the UI panels fly in from *behind* the camera (Z-axis -200px → 0), passing the user.
5.  **T=1400ms:** The "Neural Core" (center orb) ignites with a soft white flash, settling into its idle rhythm.

**Psychological Impact:**
Simulates entering a physical space. The UI doesn't load; you *enter* it. The "fly-in from behind" creates a feeling of forward momentum and immersion.
