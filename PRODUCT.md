# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: React, TypeScript, and Vite were selected for a maintainable static application with a Web Worker conversion pipeline. The app has no backend and can be hosted as static files.

## Users

Moodle administrators, teachers, and course maintainers who need to attempt restoring a backup created by a newer Moodle release into an older supported release.

## Product Purpose

MoodlIA Backup Converter inspects a Moodle `.mbz` backup, explains compatibility risks, applies a conservative target-version transformation, and downloads a converted archive. Success means the user receives either an explicit, auditable converted file or a clear explanation of why a safe conversion is not possible.

## Positioning

The converter is a privacy-preserving migration workbench: the complete archive remains on the user's device, and conversion decisions are reported instead of silently discarding unsupported Moodle data.

## Operating Context

Users select a local `.mbz` file, choose an older Moodle target, inspect detected activities and compatibility findings, approve any destructive removal of unsupported activities, run the conversion, and download both the result and a JSON report.

## Capabilities and Constraints

- All archive reading, XML transformation, compression, and download generation happen in the browser.
- Files are never uploaded by the application.
- Initial target profiles are Moodle 4.5, 4.1, and 3.11.
- The app accepts gzip-compressed tar, ZIP, and uncompressed tar Moodle archives and emits a gzip-compressed tar `.mbz` file.
- Browser memory limits constrain the practical maximum backup size. The interface must communicate this before processing.
- A version-header rewrite alone is not considered a valid conversion. Known schema and activity incompatibilities must be detected.
- Destructive removal of unsupported activities requires explicit user approval.
- Moodle 4.x question-bank structures targeting Moodle 3.11 are treated as a blocker unless the user explicitly enables an unsafe conversion.
- Full compatibility with every third-party Moodle plugin is not guaranteed. Unknown plugin data is preserved and reported.

## Brand Commitments

The product name is MoodlIA Backup Converter. Interface copy is direct, calm, and technically honest. The current interface language is Spanish; additional interface languages remain an open product decision.

## Evidence on Hand

No customer claims, compatibility benchmarks, or success-rate data are available and none may be fabricated. Compatibility profiles are based on Moodle backup metadata and known core schema differences.

## Product Principles

- Local by construction: no backup content leaves the browser.
- Explain before changing: findings precede conversion.
- Conservative by default: blockers stop conversion unless the user deliberately overrides them.
- Auditable output: every transformation appears in the downloadable report.
- Preserve unknown data unless a known incompatibility requires removal.

## Accessibility & Inclusion

The workflow must be keyboard operable, use semantic controls and live status announcements, maintain visible focus, respect reduced-motion preferences, and remain usable at narrow mobile widths and browser zoom.
