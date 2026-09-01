import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  ChevronRight,
  FileArchive,
  FileJson,
  FolderOpen,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  ConversionOptions,
  ConversionResult,
  InspectionReport,
  TargetKey,
  WorkerRequest,
  WorkerResponse,
} from "./lib/types";
import { targetOrder, targetProfiles } from "./lib/profiles";

const converterWorker = new Worker(new URL("./workers/converter.worker.ts", import.meta.url), { type: "module" });
const initialOptions: ConversionOptions = {
  removeUnsupportedActivities: false,
  allowUnsafeQuestionConversion: false,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })} ${unit}`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function App() {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestCounter = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [target, setTarget] = useState<TargetKey>("5.1");
  const [options, setOptions] = useState<ConversionOptions>(initialOptions);
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "ready" | "converting" | "done" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("Esperando una copia de seguridad");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function nextRequestId(): string {
    requestCounter.current += 1;
    return `request-${requestCounter.current}`;
  }

  function waitForResponse(request: WorkerRequest, transfer: Transferable[] = []): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      const listener = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        if (response.requestId !== request.requestId) return;
        if (response.type === "progress") {
          setStatusMessage(response.message);
          setProgress(response.value);
          return;
        }
        converterWorker.removeEventListener("message", listener);
        if (response.type === "error") reject(new Error(response.message));
        else resolve(response);
      };
      converterWorker.addEventListener("message", listener);
      converterWorker.postMessage(request, transfer);
    });
  }

  async function inspectFile(nextFile: File): Promise<void> {
    if (!nextFile.name.toLowerCase().endsWith(".mbz")) {
      setError("Selecciona un archivo con extensión .mbz.");
      setStatus("error");
      return;
    }
    if (nextFile.size > 768 * 1024 * 1024) {
      setError("El archivo supera el límite de seguridad de 768 MB para el procesamiento en navegador.");
      setStatus("error");
      return;
    }

    setFile(nextFile);
    setResult(null);
    setReport(null);
    setError(null);
    setStatus("processing");
    setProgress(4);
    setStatusMessage("Preparando el análisis local…");

    try {
      const buffer = await nextFile.arrayBuffer();
      const request: WorkerRequest = {
        type: "inspect",
        requestId: nextRequestId(),
        fileName: nextFile.name,
        buffer,
        target,
        options,
      };
      const response = await waitForResponse(request, [buffer]);
      if (response.type !== "inspected") throw new Error("Unexpected worker response.");
      setJobId(response.jobId);
      setReport(response.report);
      setStatus("ready");
      setStatusMessage("Copia inspeccionada en este dispositivo");
      setProgress(100);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se ha podido abrir la copia.");
      setStatus("error");
      setStatusMessage("La inspección no se ha completado");
    }
  }

  useEffect(() => {
    if (!jobId || !report || status === "processing" || status === "converting") return;
    let active = true;

    async function reanalyze(): Promise<void> {
      try {
        const request: WorkerRequest = {
          type: "reanalyze",
          requestId: nextRequestId(),
          jobId: jobId!,
          target,
          options,
        };
        const response = await waitForResponse(request);
        if (active && response.type === "inspected") {
          setReport(response.report);
          setResult(null);
          setStatus("ready");
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "No se ha podido actualizar el análisis.");
          setStatus("error");
        }
      }
    }

    void reanalyze();
    return () => {
      active = false;
    };
    // Reanalysis is intentionally limited to decisions that alter compatibility.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, options.removeUnsupportedActivities, options.allowUnsafeQuestionConversion]);

  async function convert(): Promise<void> {
    if (!jobId || !report?.canConvert) return;
    setStatus("converting");
    setProgress(8);
    setError(null);
    setStatusMessage("Preparando la conversión…");

    try {
      const request: WorkerRequest = {
        type: "convert",
        requestId: nextRequestId(),
        jobId,
        target,
        options,
      };
      const response = await waitForResponse(request);
      if (response.type !== "converted") throw new Error("Unexpected worker response.");
      setResult(response.result);
      setStatus("done");
      setProgress(100);
      setStatusMessage("Conversión terminada; el archivo está listo para descargar");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se ha podido convertir la copia.");
      setStatus("error");
      setStatusMessage("La conversión no se ha completado");
    }
  }

  function reset(): void {
    setFile(null);
    setJobId(null);
    setReport(null);
    setResult(null);
    setOptions(initialOptions);
    setStatus("idle");
    setStatusMessage("Esperando una copia de seguridad");
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDroppedFile(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) void inspectFile(droppedFile);
  }

  const busy = status === "processing" || status === "converting";
  const unsupportedCount = report?.activities.filter((activity) => !activity.supported).length || 0;
  const hasQuestionBlocker = report?.findings.some((finding) => finding.code === "modern-question-bank") || false;

  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="brand" href="#main" aria-label="MoodlIA Backup Converter, ir al contenido">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>
            <strong>MoodlIA</strong>
            <small>Backup Converter</small>
          </span>
        </a>
        <div className="local-status">
          <LockKeyhole size={16} aria-hidden="true" />
          <span>Procesamiento local</span>
          <span className="status-dot" aria-hidden="true" />
        </div>
      </header>

      <main id="main">
        <section className="intro" aria-labelledby="page-title">
          <p className="stage-tab"><span>01</span> Mesa de conversión</p>
          <h1 id="page-title">Lleva una copia de Moodle hacia atrás, con los riesgos a la vista.</h1>
          <p>
            Abre un archivo <code>.mbz</code>, inspecciona su manifiesto y descarga una copia adaptada. Nada sale de este navegador.
          </p>
        </section>

        <section className="workbench" aria-label="Conversor de copias">
          <div className="file-station">
            <div className="section-heading">
              <span className="index">A</span>
              <div>
                <p className="label">Documento de origen</p>
                <h2>Abre la copia</h2>
              </div>
            </div>

            <input
              ref={fileInputRef}
              id={fileInputId}
              className="visually-hidden"
              type="file"
              tabIndex={-1}
              accept=".mbz,application/gzip,application/zip,application/x-tar"
              disabled={busy}
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];
                if (selectedFile) void inspectFile(selectedFile);
              }}
            />
            <div
              className={`drop-zone${isDragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDroppedFile}
            >
              <div className="archive-glyph" aria-hidden="true">
                {file ? <FileArchive size={35} strokeWidth={1.5} /> : <FolderOpen size={35} strokeWidth={1.5} />}
              </div>
              {file ? (
                <div className="selected-file">
                  <strong>{file.name}</strong>
                  <span>{formatBytes(file.size)} · guardado solo en memoria local</span>
                </div>
              ) : (
                <div>
                  <strong>Arrastra aquí una copia .mbz</strong>
                  <span>GZIP TAR, ZIP o TAR · máximo 768 MB</span>
                </div>
              )}
            </div>
          </div>

          <div className="target-station">
            <div className="section-heading">
              <span className="index">B</span>
              <div>
                <p className="label">Ficha de destino</p>
                <h2>Selecciona la versión</h2>
              </div>
            </div>
            <fieldset className="version-selector" disabled={busy}>
              <legend className="visually-hidden">Versión de Moodle de destino</legend>
              {targetOrder.map((version) => (
                <label
                  key={version}
                  className={`${target === version ? "selected " : ""}${targetProfiles[version].maturity}`.trim()}
                >
                  <input type="radio" name="target" value={version} checked={target === version} onChange={() => setTarget(version)} />
                  <span>Moodle</span>
                  <strong>{version}</strong>
                  {targetProfiles[version].badge && <small>{targetProfiles[version].badge}</small>}
                </label>
              ))}
            </fieldset>
            <p className="version-guidance">
              <strong>Perfiles experimentales:</strong> requieren una restauración de prueba antes de utilizarlos con un curso real.
            </p>
            <div className="memory-note">
              <Info size={18} aria-hidden="true" />
              <p><strong>Sin servidor.</strong> El navegador necesita memoria adicional para descomprimir y volver a empaquetar archivos grandes.</p>
            </div>
          </div>
          <label
            className="desk-action"
            htmlFor={fileInputId}
            role="button"
            tabIndex={busy ? -1 : 0}
            aria-disabled={busy}
            onKeyDown={(event) => {
              if (!busy && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <FolderOpen size={19} aria-hidden="true" />
            <strong>{file ? "Abrir otra copia" : "Seleccionar una copia .mbz"}</strong>
            <span>{file ? "Sustituirá el análisis local actual" : "El análisis comienza en este dispositivo"}</span>
          </label>
        </section>

        <div className={`progress-rule${busy ? " is-active" : ""}`} aria-hidden="true">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <p className="live-status" role="status" aria-live="polite">{statusMessage}</p>

        {error && (
          <div className="error-banner" role="alert">
            <ShieldAlert aria-hidden="true" />
            <div><strong>No se ha podido continuar</strong><p>{error}</p></div>
          </div>
        )}

        {report && (
          <section className="inspection" aria-labelledby="inspection-title">
            <div className="inspection-header">
              <div>
                <p className="stage-tab"><span>02</span> Informe de inspección</p>
                <h2 id="inspection-title">{report.blockerCount ? "Hay decisiones pendientes" : "La copia puede convertirse"}</h2>
              </div>
              <div className={`verdict ${report.blockerCount ? "blocked" : "clear"}`}>
                {report.blockerCount ? <AlertTriangle aria-hidden="true" /> : <Check aria-hidden="true" />}
                <span>{report.blockerCount ? `${report.blockerCount} bloqueo${report.blockerCount === 1 ? "" : "s"}` : "Lista"}</span>
              </div>
            </div>

            <dl className="manifest-strip">
              <div><dt>Origen</dt><dd>{report.sourceMoodleRelease}</dd></div>
              <div><dt>Destino</dt><dd>Moodle {report.targetRelease}</dd></div>
              <div><dt>Formato</dt><dd>{report.archiveFormat.toUpperCase()}</dd></div>
              <div><dt>Actividades</dt><dd>{report.activities.length}</dd></div>
              <div><dt>Avisos</dt><dd>{report.warningCount}</dd></div>
            </dl>

            <div className="inspection-grid">
              <div className="findings-panel">
                <h3>Hallazgos</h3>
                <div className="finding-list">
                  {report.findings.map((finding, index) => (
                    <article key={`${finding.code}-${finding.activityId || index}`} className={`finding ${finding.severity}`}>
                      <span className="finding-icon" aria-hidden="true">
                        {finding.severity === "blocker" ? <ShieldAlert /> : finding.severity === "warning" ? <AlertTriangle /> : <Info />}
                      </span>
                      <div>
                        <div className="finding-meta"><span>{finding.severity === "blocker" ? "Bloqueo" : finding.severity === "warning" ? "Aviso" : "Nota"}</span><span>{String(index + 1).padStart(2, "0")}</span></div>
                        <h4>{finding.title}</h4>
                        <p>{finding.detail}</p>
                        {finding.resolution && <p className="resolution">{finding.resolution}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="decision-panel" aria-labelledby="decisions-title">
                <h3 id="decisions-title">Decisiones de conversión</h3>
                {unsupportedCount > 0 && (
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={options.removeUnsupportedActivities}
                      onChange={(event) => setOptions((current) => ({ ...current, removeUnsupportedActivities: event.target.checked }))}
                    />
                    <span className="check-control" aria-hidden="true"><Check /></span>
                    <span><strong>Eliminar {unsupportedCount} actividad{unsupportedCount === 1 ? "" : "es"} incompatible{unsupportedCount === 1 ? "" : "s"}</strong><small>Se quitarán también sus referencias conocidas.</small></span>
                  </label>
                )}
                {hasQuestionBlocker && target === "3.11" && (
                  <label className="check-row danger">
                    <input
                      type="checkbox"
                      checked={options.allowUnsafeQuestionConversion}
                      onChange={(event) => setOptions((current) => ({ ...current, allowUnsafeQuestionConversion: event.target.checked }))}
                    />
                    <span className="check-control" aria-hidden="true"><Check /></span>
                    <span><strong>Permitir preguntas no compatibles</strong><small>La restauración en Moodle 3.11 puede fallar.</small></span>
                  </label>
                )}

                <div className="change-list">
                  <p className="label">Cambios previstos</p>
                  <ol>
                    {report.plannedChanges.map((change) => <li key={change}><ChevronRight aria-hidden="true" />{change}</li>)}
                  </ol>
                </div>

                <button className="primary-action" type="button" disabled={!report.canConvert || busy} onClick={() => void convert()}>
                  {status === "converting" ? <RefreshCw className="spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  <span>{status === "converting" ? "Convirtiendo…" : `Convertir para Moodle ${target}`}</span>
                </button>
                {!report.canConvert && <p className="action-hint">Resuelve los bloqueos del informe para habilitar la conversión.</p>}
              </aside>
            </div>

            {report.activities.length > 0 && (
              <details className="activity-ledger">
                <summary>Inventario de actividades <span>{report.activities.length}</span></summary>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Actividad</th><th>Tipo</th><th>ID</th><th>Destino</th></tr></thead>
                    <tbody>
                      {report.activities.map((activity) => (
                        <tr key={`${activity.module}-${activity.id}`}>
                          <td>{activity.title}</td>
                          <td><code>{activity.module}</code></td>
                          <td>{activity.id}</td>
                          <td><span className={`support-mark ${activity.supported ? "supported" : "unsupported"}`}>{activity.supported ? "Conservar" : "Incompatible"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </section>
        )}

        {result && (
          <section className="download-drawer" aria-labelledby="download-title">
            <div className="completion-stamp" aria-hidden="true"><Check /></div>
            <div>
              <p className="stage-tab"><span>03</span> Archivo preparado</p>
              <h2 id="download-title">La conversión está lista en la memoria del navegador.</h2>
              <p>Descarga la copia y conserva el informe junto a ella. Cerrar esta pestaña elimina ambos de la memoria local.</p>
            </div>
            <div className="download-actions">
              <button type="button" className="download-primary" onClick={() => downloadBlob(new Blob([result.buffer], { type: "application/gzip" }), result.fileName)}>
                <ArrowDownToLine aria-hidden="true" /><span>Descargar .mbz<small>{formatBytes(result.buffer.byteLength)}</small></span>
              </button>
              <button type="button" className="download-secondary" onClick={() => downloadBlob(new Blob([JSON.stringify(result.report, null, 2)], { type: "application/json" }), `${result.fileName}.report.json`)}>
                <FileJson aria-hidden="true" /><span>Informe JSON</span>
              </button>
            </div>
          </section>
        )}

        {(file || report) && (
          <button className="reset-button" type="button" onClick={reset} disabled={busy}>
            <Trash2 size={17} aria-hidden="true" /> Vaciar la mesa y empezar de nuevo
          </button>
        )}
      </main>

      <footer>
        <p><strong>Privacidad por arquitectura.</strong> Sin cuentas, sin backend y sin transferencias de archivos.</p>
        <p>MoodlIA Backup Converter · Conversión conservadora, no una garantía de restauración.</p>
      </footer>
    </div>
  );
}
