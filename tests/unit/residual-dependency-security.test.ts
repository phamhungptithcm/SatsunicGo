import { it, expect } from "vitest";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const manifest = fileURLToPath(
  new URL("../../functions/package.json", import.meta.url),
);
const require = createRequire(manifest);
const {
  ROOT_CONTEXT,
  propagation,
  defaultTextMapGetter,
  defaultTextMapSetter,
  trace,
} = require("@opentelemetry/api");
const {
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} = require("@opentelemetry/core");
const {
  Resource,
  resourceFromAttributes,
} = require("@satsunicgo/otel-resources-compat");
const baggage = new W3CBaggagePropagator();
const extract = (header: string | string[]) =>
  propagation.getBaggage(
    baggage.extract(ROOT_CONTEXT, { baggage: header }, defaultTextMapGetter),
  );

it("preserves valid baggage metadata and W3C trace identity", () => {
  const context = baggage.extract(
    ROOT_CONTEXT,
    { baggage: "tenant=synthetic;flag" },
    defaultTextMapGetter,
  );
  const carrier: Record<string, string> = {};
  baggage.inject(context, carrier, defaultTextMapSetter);
  expect(carrier.baggage).toBe("tenant=synthetic;flag");
  const tc = new W3CTraceContextPropagator();
  const traced = tc.extract(
    context,
    { traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01" },
    defaultTextMapGetter,
  );
  expect(trace.getSpanContext(traced)?.traceId).toBe(
    "0123456789abcdef0123456789abcdef",
  );
});

it("bounds baggage entry count, individual size and total bytes across headers", () => {
  expect(
    extract(
      Array.from({ length: 500 }, (_, i) => `k${i}=v`).join(","),
    ).getAllEntries(),
  ).toHaveLength(180);
  expect(
    extract(`large=${"x".repeat(1000000)},safe=ok`).getAllEntries(),
  ).toEqual([["safe", { value: "ok" }]]);
  const entries = extract([
    `a=${"x".repeat(4000)}`,
    `b=${"x".repeat(4000)}`,
    `c=${"x".repeat(4000)}`,
  ]).getAllEntries();
  expect(entries.map(([key]: [string]) => key)).toEqual(["a", "b"]);
});

it("ignores malformed baggage safely and preserves later valid input", () => {
  expect(() => extract("bad=%ZZ,=missing,noequals,safe=ok")).not.toThrow();
  expect(extract("bad=%ZZ,=missing,noequals,safe=ok").getEntry("safe")).toEqual(
    { value: "ok" },
  );
});

it("normalizes async detector results and retains merge precedence", async () => {
  const merged = new Resource({ type: "global", same: "old" }).merge({
    attributes: { same: Promise.resolve("new"), project: "synthetic" },
  });
  expect(merged.asyncAttributesPending).toBe(true);
  await merged.waitForAsyncAttributes();
  expect(merged.attributes).toEqual({
    type: "global",
    same: "new",
    project: "synthetic",
  });
  expect(
    merged.merge(resourceFromAttributes({ next: true })).attributes.next,
  ).toBe(true);
  const empty = Resource.empty();
  expect(empty.merge(null)).toBe(empty);
  expect(empty.attributes).toEqual({});
  expect(Resource.default().attributes["telemetry.sdk.name"]).toBe(
    "opentelemetry",
  );
});

it("settles a failed detector attribute without losing healthy attributes", async () => {
  const resource = new Resource({ type: "global" }).merge({
    attributes: {
      bad: Promise.reject(new Error("synthetic detector failure")),
      good: Promise.resolve("ok"),
    },
  });
  await resource.waitForAsyncAttributes();
  expect(resource.asyncAttributesPending).toBe(false);
  expect(resource.attributes).toEqual({ type: "global", good: "ok" });
});

it("renders KaTeX math and refuses inherited trust and malicious resources", () => {
  const katex = require("katex");
  expect(katex.renderToString("x^2 + 1")).toContain("katex");
  const options = Object.create({ trust: true });
  const result = katex.renderToString(
    String.raw`\href{javascript:alert(1)}{click}`,
    options,
  );
  expect(result).not.toContain("href=");
  expect(
    katex.renderToString(
      String.raw`\includegraphics{https://invalid.example/synthetic.png}`,
      options,
    ),
  ).not.toContain("<img");
  expect(() => katex.renderToString(String.raw`\notARealCommand`)).toThrow();
});

it("Genkit exports traces/logs, handles failed/invalid flows and flushes without provider I/O", () => {
  const script = `
    const assert=require('node:assert/strict'); const {createRequire}=require('node:module'); const path=require('node:path');
    const r=createRequire(process.argv[1]); const {genkit,z}=r('genkit'); const {vertexAI}=r('@genkit-ai/google-genai');
    const {enableTelemetry,flushTracing}=r('@genkit-ai/core/tracing');
    const {SimpleSpanProcessor,InMemorySpanExporter}=r('@opentelemetry/sdk-trace-base');
    const {SimpleLogRecordProcessor,InMemoryLogRecordExporter}=r('@opentelemetry/sdk-logs');
    const spans=new InMemorySpanExporter(); const logs=new InMemoryLogRecordExporter();
    (async()=>{
      const ai=genkit({promptDir:null,plugins:[vertexAI({projectId:'demo-satsunicgo',location:'asia-southeast1',apiKey:false})]});
      const sp=new SimpleSpanProcessor(spans),lp=new SimpleLogRecordProcessor(logs);
      await enableTelemetry({autoDetectResources:false,instrumentations:[],spanProcessors:[sp],logRecordProcessor:lp});
      const flow=ai.defineFlow({name:'residualSuccess',inputSchema:z.string(),outputSchema:z.string()},async x=>x);
      const bad=ai.defineFlow({name:'residualFailure',inputSchema:z.string(),outputSchema:z.string()},async()=>{throw Error('synthetic failure')});
      assert.equal(await flow('offline-compatible'),'offline-compatible');
      await assert.rejects(bad('fail'),/synthetic failure/); await assert.rejects(flow(42));
      r('genkit/logging').logger.info('synthetic regression log');
      await flushTracing(); await lp.forceFlush();
      assert.ok(spans.getFinishedSpans().some(s=>s.name.includes('residualSuccess')));
      assert.ok(spans.getFinishedSpans().some(s=>s.status.code===2));
      assert.ok(logs.getFinishedLogRecords().some(l=>String(l.body).includes('synthetic regression log')));
      const cloud=r.resolve('@genkit-ai/google-cloud'),c=createRequire(cloud);
      c('@google-cloud/opentelemetry-resource-util').GcpDetectorSync.prototype.detect=()=>({attributes:{project:Promise.resolve('synthetic')}});
      const authPath=path.join(path.dirname(cloud),'auth.js'); const authModule=require(authPath);
      require.cache[authPath].exports={...authModule,resolveCurrentPrincipal:async()=>({projectId:'demo-satsunicgo',serviceAccountEmail:'synthetic@demo.invalid'})};
      const gcp=require(path.join(path.dirname(cloud),'gcpOpenTelemetry.js'));
      const g=new gcp.GcpOpenTelemetry({projectId:'demo-satsunicgo',export:false,autoInstrumentation:false,metricExportIntervalMillis:60000,metricExportTimeoutMillis:100}); await g.resource.waitForAsyncAttributes();
      assert.equal(g.resource.attributes.project,'synthetic'); assert.equal(g.resource.attributes.type,'global');
      const cfg=await g.getConfig(); const {MeterProvider}=r('@opentelemetry/sdk-metrics');
      const meter=new MeterProvider({resource:g.resource,readers:[cfg.metricReader]});
      meter.getMeter('regression').createCounter('residual_counter').add(1); await meter.forceFlush();
      assert.ok(gcp.__getMetricExporterForTesting().getMetrics().length>0);
      await meter.shutdown();await cfg.spanProcessor.shutdown();for(const i of cfg.instrumentations)i.disable();
      console.log('RESIDUAL_COMPATIBILITY_OK'); process.emit('SIGTERM');
    })().catch(e=>{console.error(e);process.exitCode=1});
  `;
  const result = spawnSync(process.execPath, ["-e", script, manifest], {
    timeout: 10000,
    encoding: "utf8",
    env: {
      ...process.env,
      GENKIT_ENV: "prod",
      GOOGLE_APPLICATION_CREDENTIALS: "/tmp/residual-no-cloud-credentials.json",
      OTEL_TRACES_EXPORTER: "none",
      OTEL_METRICS_EXPORTER: "none",
      OTEL_LOGS_EXPORTER: "none",
      ENABLE_FIREBASE_MONITORING: "false",
    },
  });
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("RESIDUAL_COMPATIBILITY_OK");
}, 15000);

it("a failed or hanging trace exporter has bounded flush/shutdown", async () => {
  const {
    BatchSpanProcessor,
    BasicTracerProvider,
  } = require("@opentelemetry/sdk-trace-base");
  for (const hangs of [false, true]) {
    let calls = 0;
    const processor = new BatchSpanProcessor(
      {
        export: (
          _spans: unknown,
          done: (result: { code: number; error: Error }) => void,
        ) => {
          calls++;
          if (!hangs)
            done({ code: 1, error: new Error("synthetic exporter failure") });
        },
        shutdown: async () => {},
      },
      { exportTimeoutMillis: 25, scheduledDelayMillis: 10000 },
    );
    const provider = new BasicTracerProvider({ spanProcessors: [processor] });
    provider.getTracer("regression").startSpan("synthetic").end();
    await expect(processor.forceFlush()).rejects.toThrow();
    expect(calls).toBe(1);
    await provider.shutdown();
  }
});

it("retains both Genkit log processor constructor forms and actual delivery", async () => {
  const {
    LoggerProvider,
    SimpleLogRecordProcessor,
    BatchLogRecordProcessor,
    InMemoryLogRecordExporter,
  } = require("@opentelemetry/sdk-logs");
  for (const Processor of [SimpleLogRecordProcessor, BatchLogRecordProcessor]) {
    const exporter = new InMemoryLogRecordExporter();
    const processor = new Processor(exporter);
    const provider = new LoggerProvider({ processors: [processor] });
    try {
      provider
        .getLogger("genkit-constructor-regression")
        .emit({ body: "synthetic delivered", severityNumber: 9 });
      await provider.forceFlush();
      expect(
        exporter
          .getFinishedLogRecords()
          .map((record: { body: string }) => record.body),
      ).toContain("synthetic delivered");
    } finally {
      await provider.shutdown();
    }
  }
});
