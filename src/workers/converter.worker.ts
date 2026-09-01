/// <reference lib="webworker" />

import { parseBackupArchive } from "../lib/archive";
import { convertBackup, inspectBackup } from "../lib/converter";
import type { ParsedArchive, WorkerRequest, WorkerResponse } from "../lib/types";

interface CachedJob {
  archive: ParsedArchive;
  fileName: string;
  sourceSize: number;
}

const jobs = new Map<string, CachedJob>();

function send(message: WorkerResponse, transfer: Transferable[] = []): void {
  self.postMessage(message, { transfer });
}

function progress(requestId: string, message: string, value: number): void {
  send({ type: "progress", requestId, message, value });
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    if (request.type === "inspect") {
      progress(request.requestId, "Abriendo el archivo local…", 18);
      const archive = parseBackupArchive(request.buffer);
      progress(request.requestId, "Leyendo el manifiesto de Moodle…", 62);
      const jobId = crypto.randomUUID();
      jobs.clear();
      jobs.set(jobId, { archive, fileName: request.fileName, sourceSize: request.buffer.byteLength });
      const report = inspectBackup(archive, request.fileName, request.buffer.byteLength, request.target, request.options);
      progress(request.requestId, "Inspección completada", 100);
      send({ type: "inspected", requestId: request.requestId, jobId, report });
      return;
    }

    const job = jobs.get(request.jobId);
    if (!job) throw new Error("The local analysis session expired. Open the backup again.");

    if (request.type === "reanalyze") {
      const report = inspectBackup(job.archive, job.fileName, job.sourceSize, request.target, request.options);
      send({ type: "inspected", requestId: request.requestId, jobId: request.jobId, report });
      return;
    }

    progress(request.requestId, "Aplicando el perfil de compatibilidad…", 28);
    const result = convertBackup(job.archive, job.fileName, job.sourceSize, request.target, request.options);
    progress(request.requestId, "Comprimiendo la nueva copia…", 78);
    send({ type: "converted", requestId: request.requestId, result }, [result.buffer]);
  } catch (error) {
    send({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : "Unexpected conversion error.",
    });
  }
});
