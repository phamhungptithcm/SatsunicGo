/** Retain default W3C telemetry while refusing vulnerable opt-in collectors. */
export function assertSafeTelemetryEnvironment(
  env: Record<string, string | undefined>,
) {
  const propagators = env.OTEL_PROPAGATORS?.split(",").map((s) => s.trim());
  if (propagators?.some((s) => !["tracecontext", "baggage"].includes(s)))
    throw new Error("Telemetry requires W3C tracecontext/baggage propagators.");
  const exporters = env.OTEL_METRICS_EXPORTER?.split(",").map((s) => s.trim());
  if (exporters?.some((s) => !["none", "otlp", "console"].includes(s)))
    throw new Error("Unsupported telemetry metrics exporter configuration.");
  if (/auto-instrumentations-node[\\/]register/.test(env.NODE_OPTIONS ?? ""))
    throw new Error("Telemetry auto-instrumentation preload is not supported.");
}
