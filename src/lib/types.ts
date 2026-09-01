export type TargetKey = "5.1" | "5.0" | "4.5" | "4.4" | "4.3" | "4.2" | "4.1" | "4.0" | "3.11";

export type TargetMaturity = "supported" | "experimental";

export type ArchiveFormat = "tar.gz" | "zip" | "tar";

export type FindingSeverity = "blocker" | "warning" | "info";

export interface ConversionOptions {
  removeUnsupportedActivities: boolean;
  allowUnsafeQuestionConversion: boolean;
}

export interface ActivitySummary {
  id: string;
  module: string;
  title: string;
  directory: string;
  contextId?: string;
  supported: boolean;
}

export interface Finding {
  code: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  resolution?: string;
  activityId?: string;
}

export interface InspectionReport {
  sourceFileName: string;
  sourceSize: number;
  archiveFormat: ArchiveFormat;
  sourceMoodleVersion: string;
  sourceMoodleRelease: string;
  sourceBackupVersion: string;
  target: TargetKey;
  targetRelease: string;
  targetMaturity: TargetMaturity;
  activities: ActivitySummary[];
  findings: Finding[];
  blockerCount: number;
  warningCount: number;
  canConvert: boolean;
  plannedChanges: string[];
}

export interface ConversionResult {
  fileName: string;
  buffer: ArrayBuffer;
  report: InspectionReport & {
    completedAt: string;
    removedActivities: Array<Pick<ActivitySummary, "id" | "module" | "title">>;
    changedFiles: string[];
  };
}

export interface ArchiveEntry {
  path: string;
  data: Uint8Array;
  directory: boolean;
}

export interface ParsedArchive {
  format: ArchiveFormat;
  entries: Map<string, ArchiveEntry>;
}

export type WorkerRequest =
  | {
      type: "inspect";
      requestId: string;
      fileName: string;
      buffer: ArrayBuffer;
      target: TargetKey;
      options: ConversionOptions;
    }
  | {
      type: "reanalyze";
      requestId: string;
      jobId: string;
      target: TargetKey;
      options: ConversionOptions;
    }
  | {
      type: "convert";
      requestId: string;
      jobId: string;
      target: TargetKey;
      options: ConversionOptions;
    };

export type WorkerResponse =
  | { type: "progress"; requestId: string; message: string; value: number }
  | { type: "inspected"; requestId: string; jobId: string; report: InspectionReport }
  | { type: "converted"; requestId: string; result: ConversionResult }
  | { type: "error"; requestId: string; message: string };
