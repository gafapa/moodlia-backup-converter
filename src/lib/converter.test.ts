import { describe, expect, it } from "vitest";
import { createMoodleBackup, parseBackupArchive } from "./archive";
import { convertBackup, inspectBackup } from "./converter";
import type { ArchiveEntry, ConversionOptions } from "./types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const safeOptions: ConversionOptions = {
  removeUnsupportedActivities: false,
  allowUnsafeQuestionConversion: false,
};

function xmlEntry(path: string, xml: string): ArchiveEntry {
  return { path, data: encoder.encode(xml), directory: false };
}

function makeArchive(entries: ArchiveEntry[]): { name: string; bytes: Uint8Array } {
  return {
    name: "course-backup.mbz",
    bytes: createMoodleBackup(entries),
  };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function fixtureEntries(): ArchiveEntry[] {
  return [
    xmlEntry(
      "moodle_backup.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
      <moodle_backup><information>
        <moodle_version>2025041400</moodle_version><moodle_release>5.0</moodle_release>
        <backup_version>2025041400</backup_version><backup_release>5.0</backup_release>
        <contents><activities>
          <activity><moduleid>12</moduleid><contextid>101</contextid><modulename>forum</modulename><title>General forum</title><directory>activities/forum_12</directory></activity>
          <activity><moduleid>27</moduleid><contextid>102</contextid><modulename>subsection</modulename><title>Advanced unit</title><directory>activities/subsection_27</directory></activity>
        </activities></contents>
      </information></moodle_backup>`,
    ),
    xmlEntry("course/course.xml", "<course><fullname>Example</fullname><pdfexportfont>freesans</pdfexportfont></course>"),
    xmlEntry("course/customfields.xml", "<customfields><customfield><value>x</value><valuetrust>1</valuetrust></customfield></customfields>"),
    xmlEntry("sections/section_1/section.xml", "<section><sequence>12,27</sequence><component>core</component><itemid>8</itemid></section>"),
    xmlEntry("activities/forum_12/module.xml", "<module><id>12</id><lang>es</lang><downloadcontent>1</downloadcontent></module>"),
    xmlEntry("activities/subsection_27/module.xml", "<module><id>27</id></module>"),
    xmlEntry("files.xml", "<files><file><contextid>101</contextid><contenthash>aaa</contenthash></file><file><contextid>102</contextid><contenthash>bbb</contenthash></file></files>"),
    xmlEntry("settings.xml", "<settings><setting><name>activity_12_included</name></setting><setting><name>activity_27_included</name></setting></settings>"),
  ];
}

describe("browser backup conversion", () => {
  it("blocks unsupported activities until removal is approved", () => {
    const fixture = makeArchive(fixtureEntries());
    const archive = parseBackupArchive(toArrayBuffer(fixture.bytes));
    const report = inspectBackup(archive, fixture.name, fixture.bytes.length, "4.1", safeOptions);

    expect(report.canConvert).toBe(false);
    expect(report.blockerCount).toBe(1);
    expect(report.activities.find((activity) => activity.module === "subsection")?.supported).toBe(false);
  });

  it("removes an approved unsupported activity and rewrites target metadata", () => {
    const fixture = makeArchive(fixtureEntries());
    const archive = parseBackupArchive(toArrayBuffer(fixture.bytes));
    const result = convertBackup(archive, fixture.name, fixture.bytes.length, "4.1", {
      ...safeOptions,
      removeUnsupportedActivities: true,
    });
    const converted = parseBackupArchive(result.buffer);
    const manifest = decoder.decode(converted.entries.get("moodle_backup.xml")?.data);
    const section = decoder.decode(converted.entries.get("sections/section_1/section.xml")?.data);
    const course = decoder.decode(converted.entries.get("course/course.xml")?.data);

    expect(manifest).toContain("<moodle_release>4.1</moodle_release>");
    expect(manifest).not.toContain("subsection");
    expect(converted.entries.has("activities/subsection_27/module.xml")).toBe(false);
    expect(section).toContain("<sequence>12</sequence>");
    expect(section).not.toContain("<component>");
    expect(course).not.toContain("pdfexportfont");
    expect(result.report.removedActivities).toEqual([
      { id: "27", module: "subsection", title: "Advanced unit" },
    ]);
  });

  it("treats a Moodle 4.x question bank as unsafe for Moodle 3.11", () => {
    const fixture = makeArchive([
      ...fixtureEntries().filter((entry) => !entry.path.includes("subsection") && !entry.path.endsWith("moodle_backup.xml")),
      xmlEntry(
        "moodle_backup.xml",
        "<moodle_backup><information><moodle_version>2024100700</moodle_version><moodle_release>4.5</moodle_release><backup_version>2024100700</backup_version><contents><activities /></contents></information></moodle_backup>",
      ),
      xmlEntry("questions.xml", "<question_categories><question_bank_entries><question_versions /></question_bank_entries></question_categories>"),
    ]);
    const archive = parseBackupArchive(toArrayBuffer(fixture.bytes));
    const blocked = inspectBackup(archive, fixture.name, fixture.bytes.length, "3.11", safeOptions);
    const overridden = inspectBackup(archive, fixture.name, fixture.bytes.length, "3.11", {
      ...safeOptions,
      allowUnsafeQuestionConversion: true,
    });

    expect(blocked.canConvert).toBe(false);
    expect(blocked.findings.some((finding) => finding.code === "modern-question-bank" && finding.severity === "blocker")).toBe(true);
    expect(overridden.findings.some((finding) => finding.code === "modern-question-bank" && finding.severity === "warning")).toBe(true);
  });

  it("rejects archive traversal paths", () => {
    const malicious = createMoodleBackup([
      xmlEntry("moodle_backup.xml", "<moodle_backup />"),
      xmlEntry("../outside.txt", "not allowed"),
    ]);

    expect(() => parseBackupArchive(toArrayBuffer(malicious))).toThrow(/Unsafe archive path/);
  });
});
