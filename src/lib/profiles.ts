import type { TargetKey, TargetMaturity } from "./types";

export interface TargetProfile {
  key: TargetKey;
  release: string;
  moodleVersion: string;
  backupVersion: string;
  maturity: TargetMaturity;
  badge?: string;
  unsupportedCoreActivities: ReadonlySet<string>;
  courseFieldsToRemove: readonly string[];
  customFieldFieldsToRemove: readonly string[];
  sectionFieldsToRemove: readonly string[];
  moduleFieldsToRemove: readonly string[];
}

export const targetOrder: readonly TargetKey[] = ["5.1", "5.0", "4.5", "4.4", "4.3", "4.2", "4.1", "4.0", "3.11"];

export const targetProfiles: Record<TargetKey, TargetProfile> = {
  "5.1": {
    key: "5.1",
    release: "5.1",
    moodleVersion: "2025100600",
    backupVersion: "2025100600",
    maturity: "experimental",
    badge: "Experimental",
    unsupportedCoreActivities: new Set(),
    courseFieldsToRemove: [],
    customFieldFieldsToRemove: [],
    sectionFieldsToRemove: [],
    moduleFieldsToRemove: [],
  },
  "5.0": {
    key: "5.0",
    release: "5.0",
    moodleVersion: "2025041400",
    backupVersion: "2025041400",
    maturity: "experimental",
    badge: "Experimental",
    unsupportedCoreActivities: new Set(),
    courseFieldsToRemove: [],
    customFieldFieldsToRemove: [],
    sectionFieldsToRemove: [],
    moduleFieldsToRemove: [],
  },
  "4.5": {
    key: "4.5",
    release: "4.5",
    moodleVersion: "2024100700",
    backupVersion: "2024100700",
    maturity: "supported",
    badge: "LTS",
    unsupportedCoreActivities: new Set(["qbank"]),
    courseFieldsToRemove: [],
    customFieldFieldsToRemove: [],
    sectionFieldsToRemove: [],
    moduleFieldsToRemove: [],
  },
  "4.4": {
    key: "4.4",
    release: "4.4",
    moodleVersion: "2024042200",
    backupVersion: "2024042200",
    maturity: "experimental",
    badge: "Experimental",
    unsupportedCoreActivities: new Set(["qbank", "subsection"]),
    courseFieldsToRemove: ["pdfexportfont"],
    customFieldFieldsToRemove: ["valuetrust"],
    sectionFieldsToRemove: ["component", "itemid"],
    moduleFieldsToRemove: [],
  },
  "4.3": {
    key: "4.3",
    release: "4.3",
    moodleVersion: "2023100900",
    backupVersion: "2023100900",
    maturity: "experimental",
    badge: "Experimental",
    unsupportedCoreActivities: new Set(["qbank", "subsection"]),
    courseFieldsToRemove: ["pdfexportfont"],
    customFieldFieldsToRemove: ["valuetrust"],
    sectionFieldsToRemove: ["component", "itemid"],
    moduleFieldsToRemove: [],
  },
  "4.2": {
    key: "4.2",
    release: "4.2",
    moodleVersion: "2023042400",
    backupVersion: "2023042400",
    maturity: "experimental",
    badge: "Experimental",
    unsupportedCoreActivities: new Set(["qbank", "subsection"]),
    courseFieldsToRemove: ["pdfexportfont"],
    customFieldFieldsToRemove: ["valuetrust"],
    sectionFieldsToRemove: ["component", "itemid"],
    moduleFieldsToRemove: [],
  },
  "4.1": {
    key: "4.1",
    release: "4.1",
    moodleVersion: "2022112800",
    backupVersion: "2022112800",
    maturity: "supported",
    badge: "LTS",
    unsupportedCoreActivities: new Set(["qbank", "subsection"]),
    courseFieldsToRemove: ["pdfexportfont"],
    customFieldFieldsToRemove: ["valuetrust"],
    sectionFieldsToRemove: ["component", "itemid"],
    moduleFieldsToRemove: [],
  },
  "4.0": {
    key: "4.0",
    release: "4.0",
    moodleVersion: "2022041900",
    backupVersion: "2022041900",
    maturity: "experimental",
    badge: "Experimental",
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
    maturity: "supported",
    badge: "Legado",
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
