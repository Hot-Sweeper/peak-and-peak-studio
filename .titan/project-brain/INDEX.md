# PROJECT BRAIN INDEX

> **This is the routing table for the Project Brain.**
> ALWAYS read this file first. Only load the files you need for your current task.

## Quick Reference

| When you need to...                        | Read this file                              |
|--------------------------------------------|---------------------------------------------|
| Understand what this project is            | `context/project-overview.md`               |
| Know the tech stack & dependencies         | `architecture/tech-stack.md`                |
| See the folder structure                   | `architecture/folder-structure.md`          |
| Understand system architecture             | `architecture/system-design.md`             |
| Know why a decision was made               | `architecture/decisions/`                   |
| Follow coding conventions                  | `context/conventions.md`                    |
| Respect user preferences                   | `context/user-preferences.md`              |
| Know the user as a person                  | `context/user-profile.md`                   |
| Understand what the user means             | `context/translations.md`                   |
| Work with APIs                             | `context/api-references.md`                 |
| See what's been built                      | `progress/changelog.md`                     |
| Know current work status                   | `progress/current-phase.md`                 |
| Check project health scores               | `progress/health-report.md`                 |
| Check known issues                         | `progress/blockers.md`                      |
| Find reusable code                         | `modules/module-registry.md`                |
| Check if an error was solved before        | `learnings/error-solutions.md`              |
| See discovered patterns                    | `learnings/patterns.md`                     |

---

## Installed Skills

| Skill | File | Stacks |
|-------|------|--------|
| Next.js + Tailwind | `.github/instructions/nextjs-tailwind.instructions.md` | nextjs, tailwind, react |
| Next.js Best Practices | `.github/instructions/nextjs.instructions.md` | nextjs, react |
| Tailwind CSS v4 | `.github/instructions/tailwind-v4-vite.instructions.md` | tailwind, vite |
| Accessibility (a11y) | `.github/instructions/a11y.instructions.md` | universal |
| Performance Optimization | `.github/instructions/performance-optimization.instructions.md` | universal |
| Security & OWASP | `.github/instructions/security-and-owasp.instructions.md` | universal |
| Node.js + Vitest | `.github/instructions/nodejs-javascript-vitest.instructions.md` | nodejs, typescript |
| Playwright E2E | `.github/instructions/playwright-typescript.instructions.md` | typescript, testing |
| Self-Explanatory Code | `.github/instructions/self-explanatory-code-commenting.instructions.md` | universal |
| HTML/CSS Style Guide | `.github/instructions/html-css-style-color-guide.instructions.md` | html, css, frontend |

---

## Session Start Checklist

1. Read `context/project-overview.md`
2. Read `progress/current-phase.md`
3. Read `context/conventions.md`
4. Read `context/translations.md` (know the user's language!)
5. Read `context/user-profile.md` (know the user as a person!)
6. Scan `modules/module-registry.md` for available modules

## Before Implementing a Feature

1. Read `architecture/system-design.md`
2. Read `architecture/folder-structure.md`
3. Read `modules/module-registry.md` — find reusable code!
4. Check `learnings/error-solutions.md` for relevant past errors
5. Check `context/api-references.md` if APIs are involved
6. Check `context/translations.md` if the request has unclear terms

## Before Making an Architecture Decision

1. Read existing ADRs in `architecture/decisions/`
2. Check `architecture/tech-stack.md` for constraints
3. Create a new ADR after the decision
