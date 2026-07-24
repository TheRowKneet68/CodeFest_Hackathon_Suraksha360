# Best Multispeciality Hospital In India

## Mission
Create implementation-ready, token-driven UI guidance for Best Multispeciality Hospital In India that is optimized for consistency, accessibility, and fast delivery across marketing site.

## Brand
- Product/brand: Best Multispeciality Hospital In India
- URL: https://www.manipalhospitals.com/
- Audience: authenticated users and operators
- Product surface: marketing site

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=Montserrat`, `font.family.stack=Montserrat, Helvetica, Open Sans, sans-serif`, `font.size.base=14px`, `font.weight.base=600`, `font.lineHeight.base=39px`
- Typography scale: `font.size.xs=10.5px`, `font.size.sm=12px`, `font.size.md=13px`, `font.size.lg=13.33px`, `font.size.xl=14px`, `font.size.2xl=15px`, `font.size.3xl=16px`, `font.size.4xl=18px`
- Color palette: `color.text.primary=#ffffff`, `color.text.secondary=#f4f7fd`, `color.surface.base=#000000`, `color.text.inverse=#0000ee`, `color.surface.raised=#034ea1`, `color.surface.strong=#164194`
- Spacing scale: `space.1=2px`, `space.2=3px`, `space.3=4px`, `space.4=5px`, `space.5=6px`, `space.6=7px`, `space.7=8px`, `space.8=9px`
- Radius/shadow/motion tokens: `radius.xs=4px`, `radius.sm=5px`, `radius.md=6px`, `radius.lg=7px`, `radius.xl=50px` | `shadow.1=rgba(0, 0, 0, 0.15) 0px 0px 12px 0px`, `shadow.2=rgba(0, 0, 0, 0.23) 0px 10px 20px 0px`, `shadow.3=rgba(0, 0, 0, 0.44) 0px 10px 20px 0px`, `shadow.4=rgb(0, 0, 0) 0px 0px 10px 0px` | `motion.duration.instant=100ms`, `motion.duration.fast=500ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (495), inputs (26), buttons (22), lists (13), tables (4), cards (2), navigation (2).


## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
