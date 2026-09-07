/**
 * The reviewer's answers live in sessionStorage, not a database.
 *
 * The interview is single-player and lasts three minutes, so the only thing
 * persistence has to survive is an accidental refresh. It clears itself when
 * the tab closes, which is the right lifetime for a demo.
 */
import type { Answer } from "./types";

const STORAGE_KEY = "assumption-diff:answers";

export function saveAnswers(answers: Answer[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Private browsing or a full quota. The in-memory flow still works.
  }
}

export function loadAnswers(): Answer[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAnswers(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}
