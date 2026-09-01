# MoodlIA Backup Converter

MoodlIA Backup Converter is a static web application that inspects a Moodle `.mbz` backup and creates a conservatively adapted copy for an older Moodle release. Archive extraction, XML transformation, compression, and download generation all run inside the browser.

No backup content is uploaded or sent to a server.

## Current target profiles

- Moodle 4.5
- Moodle 4.1
- Moodle 3.11

The converter accepts gzip-compressed TAR, ZIP, and uncompressed TAR Moodle backups. It always emits a gzip-compressed TAR `.mbz` archive.

## What it does

- Reads and validates the archive without extracting it to disk.
- Rejects traversal paths, case-insensitive duplicates, links, excessive entry counts, and unsafe expansion sizes.
- Inspects `moodle_backup.xml` and inventories the activities in the backup.
- Detects known unsupported core activities for the selected target.
- Requires explicit approval before removing unsupported activities and their known references.
- Detects the Moodle 4.x question-bank structure when targeting Moodle 3.11 and blocks by default.
- Removes selected XML fields introduced after the target release.
- Rewrites backup metadata to the selected compatibility profile.
- Downloads the converted backup and a separate JSON transformation report.

## Important limitations

This tool cannot guarantee that Moodle will restore every converted backup. Moodle and third-party plugins validate their own data during restore, and plugin-specific downgrade migrations are not generally available.

In particular, Moodle 4.x question-bank entries and versions do not have a reliable general conversion to Moodle 3.11. The interface exposes an unsafe override, but it preserves those structures rather than pretending to translate them.

The browser needs enough memory for the compressed input, expanded archive, working copy, and compressed output. The current input safety limit is 768 MB, with a 2 GB expanded-data limit. Practical limits depend on the browser and device.

## Development

Requirements:

- Node.js 22 or later
- npm

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Run automated checks:

```bash
npm run check
```

Create the deployable static site:

```bash
npm run build
```

The production output is written to `dist/` and can be hosted on any static file host. No runtime environment variables, API endpoints, database, or server functions are required.

## Architecture

- `src/App.tsx`: user workflow, decisions, progress, and downloads.
- `src/workers/converter.worker.ts`: isolated conversion orchestration.
- `src/lib/archive.ts`: secure archive detection, TAR parsing/writing, and compression.
- `src/lib/converter.ts`: Moodle manifest inspection and target transformations.
- `src/lib/profiles.ts`: target-version compatibility profiles.
- `src/lib/converter.test.ts`: archive and conversion regression tests.

## Privacy model

The selected file is read through the browser File API and transferred to a dedicated Web Worker. The app does not include upload code, analytics, remote APIs, or persistence. Closing or reloading the page clears the working archive from memory.
