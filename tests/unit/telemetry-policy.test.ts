import { createRequire } from "node:module";
import { expect, it } from "vitest";
import { assertSafeTelemetryEnvironment } from "../../functions/src/ai/telemetry-policy";
it("preserves supported W3C and exporter configurations and rejects unsafe opt-ins", () => {
  for (const env of [
    {},
    { OTEL_PROPAGATORS: "tracecontext,baggage", OTEL_METRICS_EXPORTER: "otlp" },
    { OTEL_METRICS_EXPORTER: "none" },
  ])
    expect(() => assertSafeTelemetryEnvironment(env)).not.toThrow();
  for (const env of [
    { OTEL_PROPAGATORS: "jaeger" },
    { OTEL_PROPAGATORS: "tracecontext,jaeger" },
    { OTEL_METRICS_EXPORTER: "otlp,prometheus" },
    {
      NODE_OPTIONS:
        "--require @opentelemetry/auto-instrumentations-node/register",
    },
  ])
    expect(() => assertSafeTelemetryEnvironment(env)).toThrow();
});
it("installed default tracer ignores malformed Jaeger headers", async () => {
  const require = createRequire(
    new URL("../../functions/package.json", import.meta.url),
  );
  const coreRequire = createRequire(require.resolve("@genkit-ai/core"));
  const { NodeTracerProvider } = coreRequire("@opentelemetry/sdk-trace-node");
  const { propagation, ROOT_CONTEXT, trace, context } =
    coreRequire("@opentelemetry/api");
  const provider = new NodeTracerProvider();
  provider.register();
  try {
    expect(() =>
      propagation.extract(ROOT_CONTEXT, {
        "uber-trace-id": "%",
        "uberctx-user": "%",
      }),
    ).not.toThrow();
  } finally {
    await provider.shutdown();
    propagation.disable();
    trace.disable();
    context.disable();
  }
});
