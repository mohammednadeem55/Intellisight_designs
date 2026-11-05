import { useSyncExternalStore } from "react";
import { ENABLED_PERSONAS, INITIAL_CASES, type Persona, type SsdSoeCase } from "./ssdSoeData";

// Tiny shared store so the list, the case detail and the persona switch all see the same cases without a
// backend: an update in the detail page (or an RME decision) shows up in the list straight away, and both
// survive a reload. Swap for real API calls later.
const CASES_KEY = "intellisight.ssdSoe.cases.v1";
const PERSONA_KEY = "intellisight.ssdSoe.persona.v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable: state still works for this session
  }
}

let cases: SsdSoeCase[] = read(CASES_KEY, INITIAL_CASES);
let persona: Persona = (() => { const p = read<Persona>(PERSONA_KEY, "csr"); return ENABLED_PERSONAS.includes(p) ? p : "csr"; })();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSsdSoeCases() {
  return useSyncExternalStore(subscribe, () => cases);
}
export function usePersona() {
  return useSyncExternalStore(subscribe, () => persona);
}
export function setPersona(p: Persona) {
  persona = p;
  write(PERSONA_KEY, p);
  emit();
}
export function updateCase(caseNo: string, updater: (c: SsdSoeCase) => SsdSoeCase) {
  cases = cases.map((c) => (c.caseNo === caseNo ? updater(c) : c));
  write(CASES_KEY, cases);
  emit();
}
export function addCases(newCases: SsdSoeCase[]) {
  cases = [...newCases, ...cases];
  write(CASES_KEY, cases);
  emit();
}
export function resetDemoData() {
  cases = INITIAL_CASES;
  write(CASES_KEY, cases);
  emit();
}

// Which cases a persona sees: a CSR sees everything; a Factory sees only the factory-initiated SSD cases
// (their own uploads and the status coming back); RME / SPOC sees the exceptions routed to them.
export function casesForPersona(all: SsdSoeCase[], p: Persona): SsdSoeCase[] {
  if (p === "factory") return all.filter((c) => c.source === "Factory");
  if (p === "rme") return all.filter((c) => c.rme);
  return all;
}
