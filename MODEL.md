# Model reference

Every mathematical formula and every empirical table used by the system, with
its location in the source tree. Pure computation lives in `shared/math/`,
reference data taken from the literature lives in `shared/tables/`. Nothing
outside these two directories contains model mathematics — services only
orchestrate, persist and transport.

Each function in `shared/math/` carries the same formula in its header comment,
numbered as below, so the code and this document can be read side by side.

Notation: `p` — emotion probability, `E` — 28 GoEmotions labels, `B` — 52 ARKit
blendshapes, `AU` — FACS action units, `V/A/D` — valence, arousal, dominance,
`N` — neutral VAD origin `(0.5, 0.3, 0.5)`, `clamp01(x) = min(1, max(0, x))`.

## Formulas

### 1. Probability normalization

$$\hat{p}_i = \frac{p_i}{\sum_{j \in E} p_j}$$

If every probability is zero, the result is a pure neutral distribution
($\hat{p}_{neutral} = 1$).

`shared/math/normalization.ts` → `normalizeProbabilities()` · tests: `backend/tests/unit/normalization.test.ts`

### 2. Linear blendshape mixing (mode `linear`)

$$B_j = \mathrm{clamp01}\left(m \cdot \sum_{i} \hat{p}_i \, T_{ij}\right), \quad j = 1 \ldots 52$$

$T$ is the emotion → blendshape template matrix loaded from the database, $m$ is
the user-facing intensity multiplier. The sum runs over the **27 non-neutral**
emotions: `neutral` has no template row, so it contributes an implicit zero
vector and its probability mass lowers the overall amplitude after
normalization.

`shared/math/blendshape.ts` → `mixBlendshapeTemplates()` · tests: `backend/tests/unit/blendshape-mapper.test.ts`

### 3. Emotion gating (mode `facs`)

$$\theta = \max(\theta_{abs},\ \theta_{rel} \cdot \max_{i \neq neutral} p_i), \qquad A = \{\, i \neq neutral : p_i \geq \theta \,\}$$

`neutral` is excluded from both the maximum and the resulting set. A relative
gate alone would admit noise when no emotion is strong; an absolute gate alone
would admit the whole tail when one emotion dominates.

`shared/math/activation.ts` → `selectActiveEmotions()` · tests: `backend/tests/unit/activation.test.ts`

### 4. Intensity curve

$$f(p, c) = \frac{p^{\gamma}}{p^{\gamma} + (1-p)^{\gamma}} \cdot c$$

A sigmoid-like transfer that leaves weak activations weak and saturates strong
ones. Both $p$ and $c$ are clamped to $[0, 1]$ first. The confidence factor is
$c = 1 - p_{neutral}$, so a mostly-neutral utterance scales the whole expression
down rather than being gated off.

`shared/math/activation.ts` → `intensityCurve()` · tests: `backend/tests/unit/activation.test.ts`

### 5. Action unit aggregation

$$a_u = \max_{i \in A} \big( f(p_i, c) \cdot I_{iu} \big)$$

$I_{iu}$ is the prototypical intensity of $AU_u$ for emotion $i$. Maximum, not
sum, because two emotions requesting the same muscle do not contract it twice.

`shared/math/activation.ts` → `aggregateActionUnits()` · tests: `backend/tests/unit/activation.test.ts`

### 6. Antagonist resolution

For each antagonistic pair, with $a_s$ the stronger and $a_w$ the weaker unit:

$$a_w \leftarrow \mathrm{clamp01}\big(a_w \cdot (1 - k\,(a_s - a_w))\big)$$

The suppression is proportional to the dominance gap: near-equal activations are
left almost untouched, a clear winner nearly silences its opposite. A pair is
skipped when either unit is at or below $\varepsilon$, and pairs are resolved in
table order, each seeing the values left by the previous ones.

`shared/math/activation.ts` → `resolveAntagonists()` · tests: `backend/tests/unit/activation.test.ts`

### 7. AU → blendshape projection with asymmetry

$$B_j = \mathrm{clamp01}\Big(\max_{u \,:\, j \in M(u)} \big( a_u \cdot g_u \cdot m \big)\Big)$$

$M(u)$ is the AU → blendshape mapping, $g_u$ the per-AU gain. When an asymmetry
seed is supplied, each lateral pair is detuned by a deterministic per-feature
sign $h \in [-1, 1)$:

$$B_{left} \leftarrow B_{left}(1 + \mathcal{A}h), \qquad B_{right} \leftarrow B_{right}(1 - \mathcal{A}h)$$

`shared/math/activation.ts` → `toBlendshapes()`, sign from `signedHash()` ·
tests: `backend/tests/unit/activation.test.ts`

### 8. Exponential mood decay

$$d(\Delta t) = e^{-\Delta t / \tau}$$

`shared/math/mood.ts` → `computeDecay()` · tests: `backend/tests/unit/mood.test.ts`

### 9. Adaptive reactivity

$$\beta_{eff} = \beta \cdot (1 - p_{neutral})$$

A neutral utterance should not move the mood as much as an emotional one of the
same length.

`shared/math/mood.ts` → `effectiveReactivity()` · tests: `backend/tests/unit/mood.test.ts`

### 10. Mood update (ALMA)

$$M(t) = \beta_{eff} E(t) + (1 - \beta_{eff}) \big[N + (M(t-1) - N)\, d(\Delta t)\big]$$

Mood relaxes toward the neutral origin $N$ with time constant $\tau$, and each
new utterance nudges it proportionally to $\beta_{eff}$. Applied to $V$, $A$ and
$D$ independently; each component is then clamped to $[0, 1]$.

`shared/math/mood.ts` → `updateMoodVAD()` · tests: `backend/tests/unit/mood.test.ts`

### 11. VAD → categories (inverse-distance kernel)

$$d_i^2 = (V - V_i)^2 + (A - A_i)^2 + (D - D_i)^2$$

$$w_i = \frac{1}{d_i^2 + \sigma^2}, \qquad \hat{w}_i = \frac{w_i}{\sum_j w_j}$$

$(V, A, D)$ is the current mood point, $(V_i, A_i, D_i)$ the VAD centroid of
emotion $i$, and $d_i$ the Euclidean distance between them. The $\sigma^2$ term
bounds the kernel: without it a mood landing exactly on a centroid would produce
a division by zero and a degenerate one-hot distribution.

`shared/math/mood.ts` → `vadToEmotionWeights()` · tests: `backend/tests/unit/mood.test.ts`

### 12. Emotion and mood combination

$$S(t) = w_e E_{cat}(t) + (1 - w_e) M_{cat}(t), \quad \text{renormalized to } \textstyle\sum_i S_i = 1$$

The renormalization is skipped when the sum is zero, so the result is all zeros
rather than a division by zero.

`shared/math/mood.ts` → `combineEmotionAndMood()` · tests: `backend/tests/unit/mood.test.ts`

### 13. Categories → VAD

$$V = \frac{\sum_i p_i \cdot C_i}{\sum_i p_i}$$

`shared/math/mood.ts` → `categoriesToVAD()` · tests: `backend/tests/unit/mood.test.ts`

### 14. Frame-rate independent EMA smoothing

$$\alpha(\Delta t) = 1 - e^{-\Delta t / \tau}, \qquad B(t) = \alpha B_{target} + (1 - \alpha) B(t-1)$$

The UI exposes a per-frame $\alpha_{60}$ authored at 60 Hz; it is converted once
to a time constant so that perceived smoothing speed does not depend on display
refresh rate:

$$\tau = \frac{-\Delta t_{60}}{\ln(1 - \alpha_{60})}$$

`shared/math/smoothing.ts` → `alphaToTau()` (14a), `frameAlpha()` (14b), `applyEMA()` (14c) · no automated test — the frontend has no
test runner configured

## Parameters

All model parameters live in `shared/math/constants.ts`. UI slider ranges and
defaults are a separate concern and stay in `frontend/src/utils/constants.ts`.

| Symbol          | Name                      | Value           | Used in |
| --------------- | ------------------------- | --------------- | ------- |
| $\theta_{abs}$  | `ABSOLUTE_GATE`           | 0.15            | 3       |
| $\theta_{rel}$  | `RELATIVE_GATE`           | 0.25            | 3       |
| $\gamma$        | `GAMMA`                   | 1.5             | 4       |
| $k$             | `SUPPRESSION_K`           | 0.8             | 6       |
| $\varepsilon$   | `ANTAGONIST_EPSILON`      | 1e-6            | 6       |
| $\mathcal{A}$   | `ASYMMETRY_AMPLITUDE`     | 0.12            | 7       |
| $\sigma$        | `KERNEL_SIGMA`            | 0.1             | 11      |
| $\Delta t_{60}$ | `REFERENCE_FRAME_SECONDS` | 1/60            | 14      |
| —               | `MAX_FRAME_SECONDS`       | 0.1             | 14      |
| $N$             | `NEUTRAL_VAD`             | (0.5, 0.3, 0.5) | 10      |

$\beta$ (mood reactivity), $\tau$ (mood decay), $w_e$ (emotion weight) and $m$
(expression intensity) are user-configurable per dialogue; their defaults and
ranges are in `frontend/src/utils/constants.ts`.

## Tables

Empirical data reproduced from the literature. Each file carries its own source
header; `shared/tables/emotion-au.ts` additionally marks every entry as
VERIFIED, REPRODUCED or EXTRAPOLATED.

| Symbol   | Contents                             | Size              | Source                                                                 | File                                                   |
| -------- | ------------------------------------ | ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| $C_i$    | VAD centroids per emotion            | 28 × 3            | NRC VAD Lexicon v1, Mohammad (2018)                                    | `shared/tables/emotion-vad.ts`                         |
| $I_{iu}$ | Prototypical AU patterns per emotion | 28 emotions       | EMFACS; Du et al. (2014); Keltner et al. (2019); Cordaro et al. (2018) | `shared/tables/emotion-au.ts`                          |
| $M(u)$   | AU → ARKit blendshape mapping        | 19 AU → 52 shapes | Ozel, _ARKit to FACS cheat sheet_                                      | `shared/tables/au-blendshape.ts` → `AU_TO_BLENDSHAPES` |
| $g_u$    | Per-AU gain                          | 2 overrides       | Pragmatic, documented in file                                          | `shared/tables/au-blendshape.ts` → `AU_GAINS`          |
| —        | Antagonistic AU pairs                | 8 pairs           | FACS manual; pair 6↔9 empirical                                        | `shared/tables/au-blendshape.ts` → `ANTAGONIST_PAIRS`  |
| —        | Upper/lower face regions             | 19 AU             | FACS manual                                                            | `shared/tables/au-blendshape.ts` → `FACE_REGIONS`      |
| $T_{ij}$ | Emotion → blendshape templates       | 27 × 52           | Database (`emotion_templates`), seeded from `backend/src/db/seed.ts`   | not a static file                                      |
