// Test-only stub for Next.js's "server-only" marker package.
//
// "server-only" isn't a real npm dependency (see package.json) — Next.js's
// bundler swaps `import "server-only"` for a no-op when it resolves from a
// genuine server context, and errors when it resolves from a client bundle.
// That substitution only happens inside Next's own build; a module doing
// `import "server-only"` can't be imported at all outside it (Vitest included)
// without this. Aliased in via vitest.config.ts — production code keeps the
// real safety marker unchanged.
export {};
