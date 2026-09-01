import type { TargetKey } from "./types";

export interface TargetProfile {
  key: TargetKey;
  release: string;
  moodleVersion: string;
  backupVersion: string;
  unsupportedCoreActivities: ReadonlySet<string>;
  courseFieldsToRemove: readonly string[];
  customFieldFieldsToRemove: readonly string[];
  sectionFieldsToRemove: readonly string[];
  moduleFieldsToRemove: readonly string[];
}

export const targetProfiles: Record<TargetKey, TargetProfile> = {
  "4.5": {
    key: "4.5",
    release: "4.5",
    moodleVersion: "2024100700",
    backupVersion: "2024100700",
    unsupportedCoreActivities: new Set(["qbank"]),
    courseFieldsToRemove: [],
    customFieldFieldsToRemove: [],
    sectionFieldsToRemove: [],
    moduleFieldsToRemove: [],
  },
  "4.1": {
    key: "4.1",
    release: "4.1",
    moodleVersion: "2022112800",
    backupVersion: "2022112800",
    unsupportedCoreActivities: new Set(["qbank", "subsection"]),
    courseFieldsToRemove: ["pdfexportfont"],
    customFieldFieldsToRemove: ["valuetrust"],
    sectionFieldsToRemove: ["component", "itemid"],
    moduleFieldsToRemove: [],
  },
  "3.11": {
    key: "3.11",
    release: "3.11",
    moodleVersion: "2021051700",
    backupVersion: "2021051700",
    unsupportedCoreActivities: new Set(["qbank", "subsection"]),
    courseFieldsToRemove: ["pdfexportfont"],
    customFieldFieldsToRemove: ["valuetrust"],
    sectionFieldsToRemove: ["component", "itemid"],
    moduleFieldsToRemove: ["completionpassgrade", "downloadcontent", "lang"],
  },
};

export const knownCoreActivities = new Set([
  "assign",
  "book",
  "chat",
  "choice",
  "data",
  "feedback",
  "folder",
  "forum",
  "glossary",
  "h5pactivity",
  "imscp",
  "label",
  "lesson",
  "lti",
  "page",
  "qbank",
  "quiz",
  "resource",
  "scorm",
  "subsection",
  "survey",
  "url",
  "wiki",
  "workshop",
]);
