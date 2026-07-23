---
name: design-system-best-multispeciality-hospital-in-india
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Best Multispeciality Hospital In India

## Mission
Deliver implementation-ready design-system guidance for Best Multispeciality Hospital In India that can be applied consistently across marketing site interfaces.

## Brand
- Product/brand: Best Multispeciality Hospital In India
- URL: https://www.manipalhospitals.com/
- Audience: authenticated users and operators
- Product surface: marketing site

## Style Foundations
- Visual style: structured, accessible, implementation-first
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
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
