export const MIN_ACTIVATION = 0;
export const MAX_ACTIVATION = 1;
export const FULL_CONFIDENCE = 1;
export const DEFAULT_INTENSITY_MULTIPLIER = 1;
export const SYMMETRIC_SEED = 0;

export const ABSOLUTE_GATE = 0.15; // θ_abs, formula 3
export const RELATIVE_GATE = 0.25; // θ_rel, formula 3

export const GAMMA = 1.5; // γ, formula 4

export const SUPPRESSION_K = 0.8; // k, formula 6
export const ANTAGONIST_EPSILON = 1e-6; // ε, formula 6

// ±12% of the activation, about one third of a typical 0.35 activation
// (Hauser et al. 2024). The sign is drawn per feature from a deterministic
// hash, so there is no fixed left-side bias (Ekman 1981).
// ──
// ±12% від активації, приблизно третина типової активації 0.35
// (Hauser et al. 2024). Знак береться для кожної ознаки з детермінованого
// хешу, тож сталого зсуву в лівий бік немає (Ekman 1981).
export const ASYMMETRY_AMPLITUDE = 0.12; // 𝒜, formula 7

export const KERNEL_SIGMA = 0.1; // σ, formula 11

export const REFERENCE_FRAME_SECONDS = 1 / 60; // Δt₆₀, formula 14a
export const MAX_FRAME_SECONDS = 0.1; // Δt cap, formula 14b

export const DEFAULT_TOP_EMOTIONS = 5;
