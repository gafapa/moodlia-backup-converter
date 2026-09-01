import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { createMoodleBackup } from "./archive";
import { knownCoreActivities, targetProfiles } from "./profiles";
import type {
  ActivitySummary,
  ArchiveEntry,
  ConversionOptions,
  ConversionResult,
  Finding,
  InspectionReport,
  ParsedArchive,
  TargetKey,
} from "./types";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

function readXml(entry: ArchiveEntry | undefined, path: string): Document {
  if (!entry || entry.directory) throw new Error(`Required backup file is missing: ${path}`);
  const xml = textDecoder.decode(entry.data);
  const errors: string[] = [];
  const document = new DOMParser({
    errorHandler: {
      warning: () => undefined,
      error: (message) => errors.push(message),
      fatalError: (message) => errors.push(message),
    },
  }).parseFromString(xml, "application/xml");
  if (!document || errors.length > 0) {
    throw new Error(`Invalid XML in ${path}: ${errors[0] || "unable to parse document"}`);
  }
  return document as unknown as Document;
}

function writeXml(document: Document): Uint8Array {
  const serialized = new XMLSerializer().serializeToString(document as never);
  const declaration = serialized.startsWith("<?xml") ? "" : '<?xml version="1.0" encoding="UTF-8"?>\n';
  return textEncoder.encode(declaration + serialized);
}

function firstElementText(root: Document | Element, tagName: string): string {
  return root.getElementsByTagName(tagName)[0]?.textContent?.trim() || "";
}

function setFirstElementText(document: Document, tagName: string, value: string): boolean {
  const element = document.getElementsByTagName(tagName)[0];
  if (!element) return false;
  element.textContent = value;
  return true;
}

function removeElements(document: Document, tagNames: readonly string[]): number {
  let removed = 0;
  for (const tagName of tagNames) {
    const elements = Array.from(document.getElementsByTagName(tagName));
    for (const element of elements) {
      element.parentNode?.removeChild(element);
      removed += 1;
    }
  }
  return removed;
}

function getActivities(manifest: Document, profileKey: TargetKey): ActivitySummary[] {
  const profile = targetProfiles[profileKey];
  return Array.from(manifest.getElementsByTagName("activity")).map((element) => {
    const module = firstElementText(element, "modulename");
    return {
      id: firstElementText(element, "moduleid") || element.getAttribute("moduleid") || "unknown",
      module,
      title: firstElementText(element, "title") || module || "Untitled activity",
      directory: firstElementText(element, "directory"),
      contextId: firstElementText(element, "contextid") || undefined,
      supported: !profile.unsupportedCoreActivities.has(module),
    };
  });
}

function containsModernQuestionBank(entries: Map<string, ArchiveEntry>): boolean {
  for (const [path, entry] of entries) {
    if (!entry.directory && path.endsWith("questions.xml")) {
      const xml = textDecoder.decode(entry.data);
      if (xml.includes("<question_bank_entries") || xml.includes("<question_versions")) return true;
    }
  }
  return false;
}

function makeFindings(
  archive: ParsedArchive,
  target: TargetKey,
  options: ConversionOptions,
  activities: ActivitySummary[],
): Finding[] {
  const findings: Finding[] = [];
  const unsupportedActivities = activities.filter((activity) => !activity.supported);

  for (const activity of unsupportedActivities) {
    findings.push({
      code: "unsupported-core-activity",
      severity: options.removeUnsupportedActivities ? "warning" : "blocker",
      title: `${activity.title} no existe en Moodle ${target}`,
      detail: `La actividad core “${activity.module}” no puede restaurarse en el destino seleccionado.`,
      resolution: options.removeUnsupportedActivities
        ? "La actividad y sus referencias se eliminarán de la copia convertida."
        : "Activa la eliminación explícita de actividades incompatibles para continuar.",
      activityId: activity.id,
    });
  }

  const unknownModules = [...new Set(activities.map((activity) => activity.module).filter((module) => module && !knownCoreActivities.has(module)))];
  if (unknownModules.length > 0) {
    findings.push({
      code: "third-party-plugins",
      severity: "warning",
      title: "Se han detectado plugins de terceros",
      detail: `Se conservarán sus datos, pero el destino deberá tener versiones compatibles: ${unknownModules.join(", ")}.`,
    });
  }

  if (target === "3.11" && containsModernQuestionBank(archive.entries)) {
    findings.push({
      code: "modern-question-bank",
      severity: options.allowUnsafeQuestionConversion ? "warning" : "blocker",
      title: "El banco de preguntas usa la estructura de Moodle 4.x",
      detail: "Moodle 4.0 separó entradas y versiones de preguntas. Esa estructura no tiene una traducción fiable y general a Moodle 3.11.",
      resolution: options.allowUnsafeQuestionConversion
        ? "Los datos de preguntas se conservarán sin garantizar que Moodle 3.11 pueda restaurarlos."
        : "Usa Moodle 4.1 o 4.5 como destino, o habilita conscientemente la conversión no segura.",
    });
  }

  findings.push({
    code: "plugin-version-compatibility",
    severity: "info",
    title: "La restauración final depende del Moodle de destino",
    detail: "El conversor ajusta la estructura conocida del archivo, pero Moodle y cada plugin validan sus propios datos durante la restauración.",
  });

  return findings;
}

export function inspectBackup(
  archive: ParsedArchive,
  sourceFileName: string,
  sourceSize: number,
  target: TargetKey,
  options: ConversionOptions,
): InspectionReport {
  const profile = targetProfiles[target];
  const manifest = readXml(archive.entries.get("moodle_backup.xml"), "moodle_backup.xml");
  const activities = getActivities(manifest, target);
  const findings = makeFindings(archive, target, options, activities);
  const unsupportedCount = activities.filter((activity) => !activity.supported).length;
  const plannedChanges = [
    `Actualizar la cabecera de copia a Moodle ${profile.release}.`,
    "Eliminar campos XML conocidos posteriores a la versión de destino.",
    "Reempaquetar el resultado como TAR comprimido con gzip.",
  ];
  if (options.removeUnsupportedActivities && unsupportedCount > 0) {
    plannedChanges.splice(1, 0, `Eliminar ${unsupportedCount} actividad${unsupportedCount === 1 ? "" : "es"} incompatible${unsupportedCount === 1 ? "" : "s"}.`);
  }

  const blockerCount = findings.filter((finding) => finding.severity === "blocker").length;
  return {
    sourceFileName,
    sourceSize,
    archiveFormat: archive.format,
    sourceMoodleVersion: firstElementText(manifest, "moodle_version") || "Desconocida",
    sourceMoodleRelease: firstElementText(manifest, "moodle_release") || "Desconocida",
    sourceBackupVersion: firstElementText(manifest, "backup_version") || "Desconocida",
    target,
    targetRelease: profile.release,
    activities,
    findings,
    blockerCount,
    warningCount: findings.filter((finding) => finding.severity === "warning").length,
    canConvert: blockerCount === 0,
    plannedChanges,
  };
}

function updateXmlEntry(
  entries: Map<string, ArchiveEntry>,
  path: string,
  transform: (document: Document) => boolean,
  changedFiles: string[],
): void {
  const entry = entries.get(path);
  if (!entry || entry.directory) return;
  const document = readXml(entry, path);
  if (transform(document)) {
    entries.set(path, { ...entry, data: writeXml(document) });
    changedFiles.push(path);
  }
}

function removeUnsupportedActivityData(
  entries: Map<string, ArchiveEntry>,
  manifest: Document,
  activities: ActivitySummary[],
  changedFiles: string[],
): void {
  const removedIds = new Set(activities.map((activity) => activity.id));
  const removedContextIds = new Set(activities.map((activity) => activity.contextId).filter(Boolean));

  for (const activity of activities) {
    if (!activity.directory) continue;
    const prefix = `${activity.directory.replace(/\/$/, "")}/`;
    for (const path of [...entries.keys()]) {
      if (path === activity.directory || path.startsWith(prefix)) entries.delete(path);
    }
  }

  for (const element of Array.from(manifest.getElementsByTagName("activity"))) {
    const id = firstElementText(element, "moduleid") || element.getAttribute("moduleid") || "";
    if (removedIds.has(id)) element.parentNode?.removeChild(element);
  }

  for (const path of [...entries.keys()].filter((entryPath) => /^sections\/section_[^/]+\/section\.xml$/.test(entryPath))) {
    updateXmlEntry(entries, path, (document) => {
      const sequence = document.getElementsByTagName("sequence")[0];
      if (!sequence?.textContent) return false;
      const nextSequence = sequence.textContent
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id && !removedIds.has(id))
        .join(",");
      if (nextSequence === sequence.textContent.trim()) return false;
      sequence.textContent = nextSequence;
      return true;
    }, changedFiles);
  }

  updateXmlEntry(entries, "files.xml", (document) => {
    let changed = false;
    for (const file of Array.from(document.getElementsByTagName("file"))) {
      const contextId = firstElementText(file, "contextid");
      if (removedContextIds.has(contextId)) {
        file.parentNode?.removeChild(file);
        changed = true;
      }
    }
    return changed;
  }, changedFiles);

  updateXmlEntry(entries, "settings.xml", (document) => {
    let changed = false;
    for (const setting of Array.from(document.getElementsByTagName("setting"))) {
      const name = firstElementText(setting, "name");
      if ([...removedIds].some((id) => name.includes(`_${id}_`) || name.endsWith(`_${id}`))) {
        setting.parentNode?.removeChild(setting);
        changed = true;
      }
    }
    return changed;
  }, changedFiles);
}

function applyProfileTransforms(
  entries: Map<string, ArchiveEntry>,
  target: TargetKey,
  changedFiles: string[],
): void {
  const profile = targetProfiles[target];
  updateXmlEntry(entries, "course/course.xml", (document) => removeElements(document, profile.courseFieldsToRemove) > 0, changedFiles);

  for (const path of [...entries.keys()]) {
    if (/^course\/customfields\.xml$/.test(path)) {
      updateXmlEntry(entries, path, (document) => removeElements(document, profile.customFieldFieldsToRemove) > 0, changedFiles);
    } else if (/^sections\/section_[^/]+\/section\.xml$/.test(path)) {
      updateXmlEntry(entries, path, (document) => removeElements(document, profile.sectionFieldsToRemove) > 0, changedFiles);
    } else if (/^activities\/[^/]+\/module\.xml$/.test(path)) {
      updateXmlEntry(entries, path, (document) => removeElements(document, profile.moduleFieldsToRemove) > 0, changedFiles);
    }
  }
}

export function convertBackup(
  archive: ParsedArchive,
  sourceFileName: string,
  sourceSize: number,
  target: TargetKey,
  options: ConversionOptions,
): ConversionResult {
  const inspection = inspectBackup(archive, sourceFileName, sourceSize, target, options);
  if (!inspection.canConvert) {
    throw new Error("Resolve the reported blockers before converting this backup.");
  }

  const profile = targetProfiles[target];
  const entries = new Map<string, ArchiveEntry>(
    [...archive.entries].map(([path, entry]) => [path, { ...entry, data: entry.data.slice() }]),
  );
  const changedFiles: string[] = [];
  const manifest = readXml(entries.get("moodle_backup.xml"), "moodle_backup.xml");
  const unsupportedActivities = getActivities(manifest, target).filter((activity) => !activity.supported);

  if (options.removeUnsupportedActivities && unsupportedActivities.length > 0) {
    removeUnsupportedActivityData(entries, manifest, unsupportedActivities, changedFiles);
  }

  setFirstElementText(manifest, "moodle_version", profile.moodleVersion);
  setFirstElementText(manifest, "moodle_release", profile.release);
  setFirstElementText(manifest, "backup_version", profile.backupVersion);
  setFirstElementText(manifest, "backup_release", profile.release);
  entries.set("moodle_backup.xml", {
    ...entries.get("moodle_backup.xml")!,
    data: writeXml(manifest),
  });
  changedFiles.push("moodle_backup.xml");

  applyProfileTransforms(entries, target, changedFiles);
  const output = createMoodleBackup(entries.values());
  const baseName = sourceFileName.replace(/\.mbz$/i, "");
  const outputBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;

  return {
    fileName: `${baseName}-for-moodle-${target}.mbz`,
    buffer: outputBuffer,
    report: {
      ...inspection,
      completedAt: new Date().toISOString(),
      removedActivities: options.removeUnsupportedActivities
        ? unsupportedActivities.map(({ id, module, title }) => ({ id, module, title }))
        : [],
      changedFiles: [...new Set(changedFiles)].sort(),
    },
  };
}
