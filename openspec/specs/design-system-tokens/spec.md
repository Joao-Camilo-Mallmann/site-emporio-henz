# Capability: Design System Tokens

## Purpose
Centralização, padronização e documentação dos tokens de cores do Design System extraídos do Figma oficial para a aplicação frontend com Tailwind CSS v4.

## Requirements

### Requirement: Figma-based Color Tokens Configuration in Tailwind CSS
The frontend application (`apps/web`) SHALL define centralized color design tokens in `apps/web/src/style.css` using the Tailwind CSS v4 `@theme` directive, strictly reflecting the color palette extracted from the official Figma project (`nx4bJnz6Hj3seJHFAC5sHO`).

#### Scenario: Tailwind utility classes generate theme color tokens
- **WHEN** components use utility classes such as `bg-primary`, `text-primary`, `bg-secondary`, `text-secondary`, `text-neutral-dark`, `bg-surface-light`, `bg-surface-tint`
- **THEN** Tailwind CSS SHALL resolve these classes to their corresponding CSS variables (`--color-primary`, `--color-secondary`, etc.) with the exact hex values defined from the Figma design (`#123854`, `#007CD8`, `#1D1D24`, `#FEFEFE`, `#D2E8F8`, etc.)

#### Scenario: Primary and interactive variants are available
- **WHEN** styling elements requiring interactive hover or dark tones (e.g. buttons, active navigation, hero accents)
- **THEN** utility classes for variants such as `primary-dark` (`#0C2340`) and `secondary-hover` (`#005CA1`) SHALL be available and functional

### Requirement: Agent and Project Color Guidelines Documentation
The project SHALL provide comprehensive documentation in `docs/design-system-cores.md` and enforce rules in `apps/web/agents.md` and `AGENTS.md` forbidding arbitrary inline hex colors (`[#...]`) in favor of the standardized Tailwind tokens.

#### Scenario: Developer or AI agent consults design token guide
- **WHEN** a developer or AI agent builds or edits a frontend view or component
- **THEN** they SHALL find the complete reference table mapping Figma colors to Tailwind classes and usage guidelines in `docs/design-system-cores.md` and summarized instructions in `apps/web/agents.md`

#### Scenario: Prohibition of arbitrary inline hex values
- **WHEN** an AI agent creates new UI code
- **THEN** the guidelines SHALL require the usage of theme tokens (e.g. `text-neutral-dark`, `bg-primary`) rather than hardcoded hex classes (e.g. `text-[#1D1D24]`, `bg-[#123854]`)

### Requirement: Refactoring of Existing Views to Theme Tokens
The existing application layout and views (`App.vue`, `HomeView.vue`, and related components) SHALL be refactored to consume the new Tailwind theme utility classes, completely eliminating arbitrary hex values while preserving visual fidelity.

#### Scenario: Home page visual elements use tokens
- **WHEN** `HomeView.vue` is rendered in the browser
- **THEN** the hero background SHALL use `bg-surface-tint` (`#D2E8F8`), hero organic shape and titles SHALL use `bg-primary` / `text-primary` (`#123854`), price tags and accents SHALL use `text-secondary` (`#007CD8`), and body text SHALL use `text-neutral-dark` (`#1D1D24`) without visual regression
