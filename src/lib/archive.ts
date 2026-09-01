import { gzipSync, gunzipSync, unzipSync } from "fflate";
import type { ArchiveEntry, ArchiveFormat, ParsedArchive } from "./types";

const TAR_BLOCK_SIZE = 512;
const MAX_INPUT_BYTES = 768 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 200_000;
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

function readNullTerminated(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return textDecoder.decode(end >= 0 ? bytes.subarray(0, end) : bytes).trim();
}

function parseOctal(bytes: Uint8Array): number {
  const value = readNullTerminated(bytes).replace(/\s/g, "");
  return value ? Number.parseInt(value, 8) : 0;
}

function normalizeArchivePath(rawPath: string): string {
  const path = rawPath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/{2,}/g, "/");
  const segments = path.split("/").filter(Boolean);

  if (!path || path.startsWith("/") || /^[a-zA-Z]:/.test(path) || segments.some((segment) => segment === "..")) {
    throw new Error(`Unsafe archive path: ${rawPath || "(empty)"}`);
  }

  return segments.join("/");
}

function addEntry(
  entries: Map<string, ArchiveEntry>,
  caseInsensitivePaths: Set<string>,
  entry: ArchiveEntry,
): void {
  const normalizedPath = normalizeArchivePath(entry.path);
  const caseInsensitivePath = normalizedPath.toLocaleLowerCase("en-US");

  if (entries.has(normalizedPath) || caseInsensitivePaths.has(caseInsensitivePath)) {
    throw new Error(`Duplicate archive path: ${normalizedPath}`);
  }

  if (entries.size >= MAX_ARCHIVE_ENTRIES) {
    throw new Error("The backup contains too many archive entries for safe browser processing.");
  }

  entries.set(normalizedPath, { ...entry, path: normalizedPath });
  caseInsensitivePaths.add(caseInsensitivePath);
}

function parsePaxAttributes(data: Uint8Array): Record<string, string> {
  const attributes: Record<string, string> = {};
  let cursor = 0;

  while (cursor < data.length) {
    const spaceIndex = data.indexOf(32, cursor);
    if (spaceIndex < 0) break;
    const recordLength = Number.parseInt(textDecoder.decode(data.subarray(cursor, spaceIndex)), 10);
    if (!Number.isFinite(recordLength) || recordLength <= 0) break;
    const record = textDecoder.decode(data.subarray(spaceIndex + 1, cursor + recordLength)).trimEnd();
    const separatorIndex = record.indexOf("=");
    if (separatorIndex > 0) {
      attributes[record.slice(0, separatorIndex)] = record.slice(separatorIndex + 1);
    }
    cursor += recordLength;
  }

  return attributes;
}

export function parseTar(tarBytes: Uint8Array): Map<string, ArchiveEntry> {
  const entries = new Map<string, ArchiveEntry>();
  const caseInsensitivePaths = new Set<string>();
  let cursor = 0;
  let expandedBytes = 0;
  let pendingPath: string | undefined;

  while (cursor + TAR_BLOCK_SIZE <= tarBytes.length) {
    const header = tarBytes.subarray(cursor, cursor + TAR_BLOCK_SIZE);
    if (header.every((byte) => byte === 0)) break;

    const storedChecksum = parseOctal(header.subarray(148, 156));
    let calculatedChecksum = 0;
    for (let index = 0; index < header.length; index += 1) {
      calculatedChecksum += index >= 148 && index < 156 ? 32 : header[index];
    }
    if (storedChecksum && storedChecksum !== calculatedChecksum) {
      throw new Error("The backup contains a damaged TAR header.");
    }

    const name = readNullTerminated(header.subarray(0, 100));
    const prefix = readNullTerminated(header.subarray(345, 500));
    const size = parseOctal(header.subarray(124, 136));
    const typeFlag = String.fromCharCode(header[156] || 48);
    const dataStart = cursor + TAR_BLOCK_SIZE;
    const dataEnd = dataStart + size;

    if (!Number.isSafeInteger(size) || size < 0 || dataEnd > tarBytes.length) {
      throw new Error("The backup contains an invalid TAR entry size.");
    }

    const data = tarBytes.slice(dataStart, dataEnd);
    const headerPath = prefix ? `${prefix}/${name}` : name;

    if (typeFlag === "x") {
      pendingPath = parsePaxAttributes(data).path;
    } else if (typeFlag === "L") {
      pendingPath = readNullTerminated(data);
    } else if (typeFlag === "0" || typeFlag === "\0" || typeFlag === "5") {
      const path = pendingPath || headerPath;
      pendingPath = undefined;
      const directory = typeFlag === "5";
      expandedBytes += directory ? 0 : data.length;
      if (expandedBytes > MAX_EXPANDED_BYTES) {
        throw new Error("The expanded backup is too large for safe browser processing.");
      }
      addEntry(entries, caseInsensitivePaths, { path, data: directory ? new Uint8Array() : data, directory });
    } else if (typeFlag === "1" || typeFlag === "2") {
      throw new Error("Backups containing archive links are not accepted for security reasons.");
    }

    cursor = dataStart + Math.ceil(size / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE;
  }

  return entries;
}

function isGzip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function isTar(bytes: Uint8Array): boolean {
  return bytes.length >= TAR_BLOCK_SIZE && textDecoder.decode(bytes.subarray(257, 262)) === "ustar";
}

export function parseBackupArchive(buffer: ArrayBuffer): ParsedArchive {
  if (buffer.byteLength > MAX_INPUT_BYTES) {
    throw new Error("This backup exceeds the 768 MB browser safety limit.");
  }

  const bytes = new Uint8Array(buffer);
  let format: ArchiveFormat;
  let entries: Map<string, ArchiveEntry>;

  if (isGzip(bytes)) {
    format = "tar.gz";
    if (bytes.length >= 4) {
      const footer = bytes.length - 4;
      const declaredSize = bytes[footer] | (bytes[footer + 1] << 8) | (bytes[footer + 2] << 16) | (bytes[footer + 3] << 24);
      if ((declaredSize >>> 0) > MAX_EXPANDED_BYTES) {
        throw new Error("The expanded backup is too large for safe browser processing.");
      }
    }
    entries = parseTar(gunzipSync(bytes));
  } else if (isZip(bytes)) {
    format = "zip";
    let declaredExpandedBytes = 0;
    let declaredEntries = 0;
    const unzipped = unzipSync(bytes, {
      filter: (file) => {
        declaredEntries += 1;
        declaredExpandedBytes += file.originalSize;
        if (declaredEntries > MAX_ARCHIVE_ENTRIES) {
          throw new Error("The backup contains too many archive entries for safe browser processing.");
        }
        if (declaredExpandedBytes > MAX_EXPANDED_BYTES) {
          throw new Error("The expanded backup is too large for safe browser processing.");
        }
        return true;
      },
    });
    entries = new Map();
    const caseInsensitivePaths = new Set<string>();
    let expandedBytes = 0;
    for (const [rawPath, data] of Object.entries(unzipped)) {
      const directory = rawPath.endsWith("/");
      expandedBytes += directory ? 0 : data.length;
      if (expandedBytes > MAX_EXPANDED_BYTES) {
        throw new Error("The expanded backup is too large for safe browser processing.");
      }
      addEntry(entries, caseInsensitivePaths, { path: rawPath, data, directory });
    }
  } else if (isTar(bytes)) {
    format = "tar";
    entries = parseTar(bytes);
  } else {
    throw new Error("This file is not a recognized gzip TAR, ZIP, or TAR Moodle backup.");
  }

  if (!entries.has("moodle_backup.xml")) {
    throw new Error("The archive does not contain moodle_backup.xml at its root.");
  }

  return { format, entries };
}

function writeString(target: Uint8Array, offset: number, length: number, value: string): void {
  const encoded = textEncoder.encode(value);
  target.set(encoded.subarray(0, length), offset);
}

function writeOctal(target: Uint8Array, offset: number, length: number, value: number): void {
  const encoded = textEncoder.encode(value.toString(8).padStart(length - 1, "0") + "\0");
  target.set(encoded.subarray(0, length), offset);
}

function splitUstarPath(path: string): { name: string; prefix: string } {
  if (textEncoder.encode(path).length <= 100) return { name: path, prefix: "" };

  const segments = path.split("/");
  for (let index = segments.length - 1; index > 0; index -= 1) {
    const prefix = segments.slice(0, index).join("/");
    const name = segments.slice(index).join("/");
    if (textEncoder.encode(prefix).length <= 155 && textEncoder.encode(name).length <= 100) {
      return { name, prefix };
    }
  }

  throw new Error(`Archive path is too long for Moodle-compatible USTAR output: ${path}`);
}

function createTarHeader(entry: ArchiveEntry): Uint8Array {
  const header = new Uint8Array(TAR_BLOCK_SIZE);
  const { name, prefix } = splitUstarPath(entry.path);
  writeString(header, 0, 100, name);
  writeOctal(header, 100, 8, entry.directory ? 0o755 : 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, entry.directory ? 0 : entry.data.length);
  writeOctal(header, 136, 12, Math.floor(Date.now() / 1000));
  header.fill(32, 148, 156);
  header[156] = entry.directory ? 53 : 48;
  writeString(header, 257, 6, "ustar\0");
  writeString(header, 263, 2, "00");
  writeString(header, 265, 32, "moodlia");
  writeString(header, 297, 32, "moodlia");
  writeString(header, 345, 155, prefix);

  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  const checksumText = checksum.toString(8).padStart(6, "0");
  writeString(header, 148, 6, checksumText);
  header[154] = 0;
  header[155] = 32;
  return header;
}

export function createTar(entries: Iterable<ArchiveEntry>): Uint8Array {
  const orderedEntries = [...entries].sort((left, right) => left.path.localeCompare(right.path));
  const totalSize = orderedEntries.reduce(
    (sum, entry) => sum + TAR_BLOCK_SIZE + (entry.directory ? 0 : Math.ceil(entry.data.length / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE),
    TAR_BLOCK_SIZE * 2,
  );
  const tar = new Uint8Array(totalSize);
  let cursor = 0;

  for (const entry of orderedEntries) {
    tar.set(createTarHeader(entry), cursor);
    cursor += TAR_BLOCK_SIZE;
    if (!entry.directory) {
      tar.set(entry.data, cursor);
      cursor += Math.ceil(entry.data.length / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE;
    }
  }

  return tar;
}

export function createMoodleBackup(entries: Iterable<ArchiveEntry>): Uint8Array {
  return gzipSync(createTar(entries), { level: 6 });
}
