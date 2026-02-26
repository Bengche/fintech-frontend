/**
 * haptic() — trigger a subtle tactile pulse on mobile devices.
 *
 * Uses the Vibration API (supported on Android Chrome; silently ignored
 * on iOS Safari and desktop browsers — no errors, no side effects).
 *
 * Usage:
 *   import { haptic } from "@/hooks/useHaptic";
 *   onClick={() => { haptic(); doSomething(); }}
 *
 * Patterns:
 *   haptic()        → 8 ms  — gentle tap (default, for most buttons)
 *   haptic("soft")  → 5 ms  — very subtle (toggles, tabs)
 *   haptic("medium")→ 12 ms — noticeable (primary actions, form submit)
 *   haptic("heavy") → [20, 40, 20] — strong (destructive actions: delete)
 */
export type HapticStyle = "soft" | "medium" | "heavy" | number | number[];

export function haptic(style: HapticStyle = "soft"): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;

  const patterns: Record<string, number | number[]> = {
    soft: 6,
    medium: 12,
    heavy: [18, 50, 18],
  };

  const pattern =
    typeof style === "string" ? patterns[style] : style;

  navigator.vibrate(pattern);
}
