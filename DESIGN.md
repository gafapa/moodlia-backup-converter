---
name: "MoodlIA Backup Converter"
description: "An archive conservation desk for inspecting, approving, and auditing Moodle backup conversions."
colors:
  archive-paper: "#f7f3e9"
  archive-paper-deep: "#ece5d7"
  archive-ink: "#15233a"
  ink-muted: "#627084"
  ledger-line: "#c7c0b3"
  ledger-line-dark: "#8d8a83"
  action-cobalt: "#1557d6"
  action-cobalt-dark: "#0c378a"
  inspection-orange: "#e6532f"
  inspection-amber: "#f4c956"
  completion-green: "#1f7a57"
  paper-white: "#fffef9"
  blocker-red: "#a93620"
  disabled-slate: "#a9afba"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(40px, 5.8vw, 76px)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(30px, 4vw, 48px)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Segoe UI Variable, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Segoe UI Variable, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Segoe UI Variable, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.14em"
  mono:
    fontFamily: "Cascadia Code, SFMono-Regular, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  square: "0px"
  seal: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  regular: "16px"
  lg: "18px"
  xl: "24px"
  xxl: "28px"
  section: "42px"
  panel: "46px"
components:
  button-primary:
    backgroundColor: "{colors.action-cobalt}"
    textColor: "{colors.paper-white}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0 18px"
    height: "54px"
  button-primary-hover:
    backgroundColor: "{colors.action-cobalt-dark}"
    textColor: "{colors.paper-white}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled-slate}"
    textColor: "{colors.paper-white}"
  file-aperture:
    backgroundColor: "{colors.archive-paper}"
    textColor: "{colors.archive-ink}"
    rounded: "{rounded.square}"
    padding: "30px"
    height: "230px"
  version-option:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.archive-ink}"
    rounded: "{rounded.square}"
    padding: "16px 12px"
    height: "96px"
  version-option-selected:
    backgroundColor: "{colors.action-cobalt}"
    textColor: "{colors.paper-white}"
  workbench-card:
    backgroundColor: "{colors.archive-paper}"
    textColor: "{colors.archive-ink}"
    rounded: "{rounded.square}"
  stage-tab:
    backgroundColor: "{colors.archive-paper-deep}"
    textColor: "{colors.action-cobalt-dark}"
    typography: "{typography.mono}"
    rounded: "{rounded.square}"
    padding: "0 12px 0 0"
    height: "30px"
  decision-checkbox:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.archive-ink}"
    rounded: "{rounded.square}"
    padding: "14px"
    height: "68px"
  verdict-blocked:
    backgroundColor: "{colors.archive-paper-deep}"
    textColor: "{colors.blocker-red}"
    typography: "{typography.mono}"
    rounded: "{rounded.square}"
    padding: "0 16px"
    height: "48px"
  manifest-strip:
    backgroundColor: "{colors.archive-ink}"
    textColor: "{colors.paper-white}"
    typography: "{typography.mono}"
    rounded: "{rounded.square}"
  completion-drawer:
    backgroundColor: "#eff9f3"
    textColor: "{colors.archive-ink}"
    rounded: "{rounded.square}"
    padding: "clamp(28px, 4vw, 44px)"
  download-primary:
    backgroundColor: "{colors.completion-green}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.square}"
    padding: "0 15px"
    height: "50px"
---

# Design System: MoodlIA Backup Converter

## Overview

**Creative North Star: "The Archive Conservation Desk"**

MoodlIA Backup Converter feels like a working conservation table for a fragile technical archive. Warm ruled paper, deep institutional ink, square folder tabs, and evidence marks turn the workflow into an inspection record rather than a generic upload wizard. The atmosphere is calm, exacting, and materially grounded.

The interface is dense enough to support consequential decisions but never dashboard-like. It moves from opening a backup, through compatibility evidence and explicit approval of loss, to an auditable download. Color and elevation are deliberately scarce so that selection, risk, and completion retain their meaning.

**Key Characteristics:**

- Warm archive paper with a subtle 32px ruled baseline.
- Deep ink masthead and data strips that frame the work as an official record.
- Cobalt actions and selected states, with amber accents that mark inspected choices.
- Orange and red reserved for inspection, progress, blockers, and destructive risk.
- Square sheets, tabs, controls, and borders; only status dots and completion seals are round.
- Editorial serif headlines paired with pragmatic sans-serif copy and monospaced evidence.

## Colors

The palette combines aged paper neutrals with institutional ink, decisive cobalt, and restrained inspection colors.

### Primary

- **Action Cobalt:** The sole high-energy action color, used for the file action bar, conversion button, selected target, progress, focus-related accents, and stage tabs.
- **Deep Action Cobalt:** The committed hover state for interactive cobalt surfaces and the darker ink used for stage-tab copy.

### Secondary

- **Inspection Orange:** Marks the masthead rule, active processing, editorial rules, the brand tile, and destructive-option emphasis.
- **Inspection Amber:** A small, luminous mark for focus outlines, the selected-version inset rule, LTS tags, and the archive-glyph glow.

### Tertiary

- **Completion Green:** Reserved for successful verdicts, the prepared-download drawer, and download controls.
- **Blocker Red:** Reserved for blocker verdicts, unsupported marks, and destructive reset hover states.

### Neutral

- **Archive Ink:** The dominant text color and the background of the masthead, manifest strip, archive glyph, and inventory count.
- **Muted Ink:** Secondary explanations, status text, and low-priority metadata.
- **Archive Paper:** The primary worksheet and inspection surface.
- **Deep Archive Paper:** The page ground beneath sheets and the scrollbar track.
- **Paper White:** A brighter paper used for choices, decision panels, ledgers, and text on dark or colored controls.
- **Ledger Line:** Routine separators inside the worksheet.
- **Dark Ledger Line:** Outer sheet borders and stronger control boundaries.
- **Disabled Slate:** The visibly unavailable state of consequential actions.

**The Cobalt Is Consent Rule.** Use cobalt for selection, navigation through the workflow, and user-authorized action; do not use it as ambient decoration.

**The Inspection Mark Rule.** Orange, amber, and blocker red behave like annotations on a record: compact, high-signal, and tied to review or risk.

## Typography

**Display Font:** Newsreader (with Georgia and serif fallbacks)

**Body Font:** Segoe UI Variable (with Segoe UI, system sans-serif fallbacks)
**Label/Mono Font:** Cascadia Code (with SFMono-Regular, Consolas, and monospace fallbacks)

**Character:** Newsreader supplies the archival, editorial voice of headings and version numerals. Segoe UI keeps operational copy direct and highly legible, while Cascadia Code separates evidence, indices, and live machine state from narrative language.

### Hierarchy

- **Display** (500, responsive 40–76px, 0.98 line-height): The single page thesis; on phones its responsive range changes to 38–55px to preserve the deliberate multi-line composition.
- **Headline** (500, responsive 30–48px, 1.05 line-height): Inspection and completion milestones.
- **Title** (700, 21px, 1.2 line-height): Station headings such as opening the backup and selecting a target.
- **Body** (400, 16px, 1.65 line-height): Introductory explanation; denser operational paragraphs step down to 11–13px while retaining generous line height.
- **Label** (800, 10px, 0.14em tracking, uppercase): Document labels, table headings, and evidence categories.
- **Mono** (700, 11px, 1.4 line-height): Stage tabs, live status, manifest values, evidence counters, and compact action annotations.

**The Evidence Has a Separate Voice Rule.** Use monospaced type only for machine state, indices, archive facts, and procedural labels—not for ordinary explanatory prose.

**The Serif Carries Meaning Rule.** Newsreader belongs to the page thesis, milestone headings, file names, and version numerals; it should not spread into controls or dense findings copy.

## Layout

The application uses a centered work surface capped at 1180px, with 20px gutters on ordinary screens and 12px gutters on narrow phones. The first viewport places a compact masthead above a two-column introduction and a two-column inspection desk. The file station receives slightly more width than the target ledger, and their shared cobalt action spans the complete sheet at the common baseline.

The spatial rhythm is built from compact 8–18px relationships inside controls, 24–28px component padding, and 42–46px separation around major sheets. Responsive behavior is explicit: at 880px, the introduction, workbench, report, and completion drawer become single-column; panel dividers rotate from vertical to horizontal. At 600px, station padding contracts to 18px horizontally, the masthead becomes 68px tall, verbose local-status text becomes visually hidden, the manifest becomes a two-column ledger, and download actions stack.

The 32px ruled-paper baseline is a visual texture rather than a requirement that every element snap to a rigid grid. Tables and manifest strips remain horizontally legible; the activity ledger provides overflow scrolling where necessary.

**The Shared Baseline Rule.** In split work areas, align the primary action across the complete sheet rather than attaching separate actions to each panel.

## Elevation & Depth

The system is flat by default. Depth comes first from paper tone, dark outer rules, internal ledger dividers, and ink-filled strips. Shadows are structural and limited to the main workbench/report sheet, the primary conversion button, the glowing archive glyph, and the successful download drawer.

### Shadow Vocabulary

- **Sheet Lift** (`0 18px 60px rgb(21 35 58 / 10%)`): A broad, low-contrast shadow under the main workbench and report sheet.
- **Action Lift** (`4px 7px 16px rgb(21 35 58 / 28%)`): The default primary conversion action; hover increases it to `6px 10px 20px rgb(21 35 58 / 32%)` while moving the control one pixel up and left.
- **Inspection Glow** (`6px 8px 14px rgb(244 201 86 / 55%)`): A warm marker glow behind the dark archive glyph.
- **Completion Lift** (`8px 12px 28px rgb(31 122 87 / 20%)`): A success-colored lift used only on the prepared-download drawer.

**The Paper First, Lift Second Rule.** Establish hierarchy with surface tone and borders before adding shadow; ordinary choices, findings, notes, and ledgers stay unraised.

## Shapes

The dominant form language is square and documentary. Cards, buttons, inputs, tabs, badges, checkboxes, and data strips use zero radius and visible rules. A small two-degree rotation makes the orange brand tile feel manually affixed, while verdict stamps rotate by one degree to resemble an inspection mark.

Circular geometry is semantic, not decorative: it is limited to the live-status dot and the double-ruled completion seal. Thin one-pixel rules carry routine structure; two-pixel rules mark verdicts and successful completion.

**The Square Sheet Rule.** Keep operational surfaces rectilinear. Do not soften the conservation-desk character with generic rounded cards or pill controls.

## Components

### Buttons

Buttons feel decisive, weighty, and administrative.

- **Shape:** Square edges with no radius; primary actions use a 54px minimum height and download actions use 50px.
- **Primary:** Cobalt fill, white text, 18px horizontal padding, centered icon-and-label composition, and strong 800-weight text.
- **Hover / Focus:** Hover deepens to dark cobalt, shifts one pixel up and left, and strengthens the action shadow. Keyboard focus uses a 3px amber outline with a 3px offset. Reduced-motion preference collapses transitions and animations to effectively instantaneous feedback.
- **Disabled:** Disabled actions change to slate, lose their shadow, and use a not-allowed cursor.
- **Download:** The primary download uses completion green; the report download reverses to white with a green rule and text.
- **Reset:** A low-priority transparent text button uses only an underline and turns blocker red on hover.

### Chips

Tags and marks behave like archival labels rather than pills.

- **Style:** Square, tightly padded, uppercase, and bordered or filled. The amber LTS label is the smallest; support marks use a one-pixel current-color rule.
- **State:** Supported marks use completion green, unsupported marks use blocker red, and the selected version gains an amber top inset over cobalt.

### Cards / Containers

Sheets feel ruled, divided, and materially flat.

- **Corner Style:** Square throughout.
- **Background:** Archive Paper for inspection surfaces and Paper White for decisions, ledgers, and target options.
- **Shadow Strategy:** Only the workbench and inspection sheet receive Sheet Lift; internal panels remain flat.
- **Border:** Dark Ledger Line on the outside and Ledger Line for internal divisions.
- **Internal Padding:** Responsive station and panel padding tops out at 42–46px and contracts to 18px horizontally on narrow screens.

### Inputs / Fields

Inputs are exposed as document-handling instruments rather than generic form boxes.

- **File Aperture:** A 230px minimum-height ruled-paper field with a dashed dark ledger border, centered archive glyph, and descriptive file metadata. Once a file is present, the border becomes solid.
- **Drag State:** Cobalt border, pale cobalt ground, and a two-pixel upward movement.
- **Version Selector:** A compact three-column ledger of square target cells inside one ruled fieldset. Selection replaces white with cobalt and adds a five-pixel amber top inset; concise badges distinguish LTS, legacy, and experimental profiles.
- **Decision Checkbox:** A 24px square check control inside a full-width bordered row. Checked state fills cobalt; destructive approval fills orange.
- **Focus:** The control row receives the shared three-pixel amber focus outline through its contained native input.

### Navigation

The masthead is a compact ink bar with a six-pixel orange baseline. The MoodlIA mark anchors left; a bordered local-processing assurance anchors right. On phones, the assurance keeps its lock icon while its explanatory text is visually hidden, preserving both trust and space.

### Stage Tab

The stage tab is the recurring workflow index: a square cobalt number cell attached to a bordered monospaced label. It introduces the conversion desk, inspection report, and prepared archive without becoming a conventional stepper.

### Manifest Strip

The manifest is an ink-filled evidence ledger with five cells, muted uppercase labels, and monospaced values. It changes to two columns on phones, with the final cell spanning the width, so archive facts remain scan-friendly before the detailed findings.

### Verdict Stamp

The verdict is a two-pixel current-color outline with uppercase monospaced text and a one-degree counterclockwise rotation. Blocked state uses blocker red; clear state uses completion green. It should read as a review stamp, not a generic status badge.

### Completion Drawer

The completed state is the only softly tinted success sheet: pale green paper, a two-pixel green rule, a double-ring circular seal, and paired green download actions. Its entrance combines a short upward reveal with a subtle scale change and fully respects reduced-motion preference.

## Do's and Don'ts

### Do:

- **Do** use warm paper, deep ink, and visible ledger rules to preserve the archive-conservation setting.
- **Do** reserve cobalt for deliberate action, selection, stage indexing, and active progress.
- **Do** show compatibility evidence before presenting destructive approval or conversion as available.
- **Do** use Newsreader for consequential editorial headings and Cascadia Code for evidence and machine state.
- **Do** keep keyboard focus visibly amber and preserve the reduced-motion and forced-colors accommodations.
- **Do** let desktop split panes collapse into a clear document sequence below 880px.

### Don't:

- **Don't** introduce rounded dashboard cards, pill selectors, gradient hero panels, or soft SaaS-style controls.
- **Don't** use orange, amber, red, or green as broad decorative fills; they are inspection and outcome signals.
- **Don't** add shadows to routine rows, findings, labels, or target cells; borders and paper tones already establish their hierarchy.
- **Don't** turn the workflow into a generic multi-step wizard or hide consequential evidence behind progressive disclosure.
- **Don't** use monospaced text for normal prose or Newsreader for dense operational controls.
- **Don't** add shipping raster imagery without recording its provenance; the current system ships no raster assets.
