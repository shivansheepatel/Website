/**
 * ============================================================================
 *  STUDENT STATE
 * ============================================================================
 *
 * One React context holding everything the student has done: quiz answers,
 * saved programs, per-program preparation checklists, submitted applications,
 * and next-cohort alerts. All of it persists to `localStorage`, none of it
 * leaves the device, and there is no account anywhere in the flow.
 *
 * SSR NOTE: this app server-renders. `localStorage` does not exist on the
 * server, so every read happens inside an effect and the provider exposes a
 * `hydrated` flag. Render the signed-out state on the server and let the real
 * state arrive on the client — rendering saved data during SSR would produce a
 * hydration mismatch and a visible flash.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { FEATURES, STORAGE_KEYS } from "@/config/site";
import { EMPTY_PROFILE, hasSignal, type StudentProfile } from "@/lib/match";

interface PersistedState {
  version: 2;
  profile: StudentProfile;
  /** True once the student has finished *or* dismissed the quiz. */
  seen: boolean;
  /** True when they chose "skip & explore" rather than finishing. */
  skipped: boolean;
  /** Program ids on their roadmap. */
  saved: string[];
  /** programId -> completed prep step ids. */
  checklists: Record<string, string[]>;
  /** Program ids the student has marked as submitted. */
  submitted: string[];
  /** Program ids they want a next-cohort reminder for. */
  alerts: string[];
}

const DEFAULT_STATE: PersistedState = {
  version: 2,
  profile: EMPTY_PROFILE,
  seen: false,
  skipped: false,
  saved: [],
  checklists: {},
  submitted: [],
  alerts: [],
};

interface Ctx {
  profile: StudentProfile;
  /** False until localStorage has been read. Guard anything personalised. */
  hydrated: boolean;
  seen: boolean;
  skipped: boolean;
  personalised: boolean;

  quizOpen: boolean;
  openQuiz: () => void;
  closeQuiz: () => void;
  updateProfile: (patch: Partial<StudentProfile>) => void;
  completeQuiz: (profile: StudentProfile) => void;
  skipQuiz: () => void;
  resetProfile: () => void;

  saved: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  clearSaved: () => void;

  /** Completed prep step ids for one program. */
  stepsFor: (programId: string) => string[];
  toggleStep: (programId: string, stepId: string) => void;
  /** Total prep steps ticked across every program — drives badges. */
  totalSteps: number;

  submitted: string[];
  isSubmitted: (id: string) => boolean;
  toggleSubmitted: (id: string) => void;

  alerts: string[];
  hasAlert: (id: string) => boolean;
  toggleAlert: (id: string) => void;

  /** Wipe everything. Used by the "start over" control. */
  resetAll: () => void;
}

const OnboardingContext = createContext<Ctx | null>(null);

/** Read saved state, migrating a v1 profile if one is present. */
function readStored(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.profile);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        ...DEFAULT_STATE,
        ...parsed,
        version: 2,
        profile: { ...EMPTY_PROFILE, ...(parsed.profile ?? {}) },
        saved: parsed.saved ?? [],
        checklists: parsed.checklists ?? {},
        submitted: parsed.submitted ?? [],
        alerts: parsed.alerts ?? [],
      };
    }

    // --- migrate from the pre-lifecycle version ---
    const legacy = window.localStorage.getItem(STORAGE_KEYS.legacyProfile);
    if (legacy) {
      const old = JSON.parse(legacy) as { profile?: Partial<StudentProfile>; shortlist?: string[] };
      return {
        ...DEFAULT_STATE,
        profile: { ...EMPTY_PROFILE, ...(old.profile ?? {}) },
        saved: old.shortlist ?? [],
        seen: Boolean(old.profile?.completedAt),
      };
    }
    const older = window.localStorage.getItem(STORAGE_KEYS.legacyShortlist);
    if (older) return { ...DEFAULT_STATE, saved: JSON.parse(older) as string[] };

    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setState(stored);
    setHydrated(true);
    if (FEATURES.autoOpenQuiz && !stored.seen) {
      // Let the page paint first so the modal reads as a greeting, not a wall.
      const timer = window.setTimeout(() => setQuizOpen(true), 1100);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state));
    } catch {
      /* storage blocked (private mode, disabled cookies) — stay in memory */
    }
  }, [state, hydrated]);

  const updateProfile = useCallback((patch: Partial<StudentProfile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const completeQuiz = useCallback((profile: StudentProfile) => {
    setState((s) => ({
      ...s,
      profile: { ...profile, completedAt: new Date().toISOString() },
      seen: true,
      skipped: false,
    }));
    setQuizOpen(false);
  }, []);

  const skipQuiz = useCallback(() => {
    setState((s) => ({ ...s, seen: true, skipped: true }));
    setQuizOpen(false);
  }, []);

  const resetProfile = useCallback(() => {
    setState((s) => ({ ...s, profile: EMPTY_PROFILE, seen: false, skipped: false }));
    setQuizOpen(true);
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...DEFAULT_STATE });
    setQuizOpen(false);
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
    }));
  }, []);

  const clearSaved = useCallback(() => setState((s) => ({ ...s, saved: [] })), []);

  const toggleStep = useCallback((programId: string, stepId: string) => {
    setState((s) => {
      const done = s.checklists[programId] ?? [];
      const next = done.includes(stepId) ? done.filter((x) => x !== stepId) : [...done, stepId];
      return { ...s, checklists: { ...s.checklists, [programId]: next } };
    });
  }, []);

  const toggleSubmitted = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      submitted: s.submitted.includes(id)
        ? s.submitted.filter((x) => x !== id)
        : [...s.submitted, id],
    }));
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      alerts: s.alerts.includes(id) ? s.alerts.filter((x) => x !== id) : [...s.alerts, id],
    }));
  }, []);

  const totalSteps = useMemo(
    () => Object.values(state.checklists).reduce((sum, list) => sum + list.length, 0),
    [state.checklists],
  );

  const value = useMemo<Ctx>(
    () => ({
      profile: state.profile,
      hydrated,
      seen: state.seen,
      skipped: state.skipped,
      personalised: hydrated && state.profile.completedAt !== null && hasSignal(state.profile),

      quizOpen,
      openQuiz: () => setQuizOpen(true),
      closeQuiz: () => {
        setQuizOpen(false);
        setState((s) => ({ ...s, seen: true }));
      },
      updateProfile,
      completeQuiz,
      skipQuiz,
      resetProfile,

      saved: state.saved,
      isSaved: (id) => state.saved.includes(id),
      toggleSaved,
      clearSaved,

      stepsFor: (programId) => state.checklists[programId] ?? [],
      toggleStep,
      totalSteps,

      submitted: state.submitted,
      isSubmitted: (id) => state.submitted.includes(id),
      toggleSubmitted,

      alerts: state.alerts,
      hasAlert: (id) => state.alerts.includes(id),
      toggleAlert,

      resetAll,
    }),
    [
      state,
      hydrated,
      quizOpen,
      updateProfile,
      completeQuiz,
      skipQuiz,
      resetProfile,
      toggleSaved,
      clearSaved,
      toggleStep,
      totalSteps,
      toggleSubmitted,
      toggleAlert,
      resetAll,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): Ctx {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside <OnboardingProvider>. Check __root.tsx.");
  }
  return ctx;
}
