import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const functionsManifest = fileURLToPath(
  new URL("../../functions/package.json", import.meta.url),
);
const require = createRequire(functionsManifest);

it("patched legacy UUID consumers retain v4 and reject incomplete v5 buffer writes", () => {
  const genkitRequire = createRequire(require.resolve("genkit"));
  const uuid = genkitRequire("uuid");
  expect(uuid.v4()).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(() => uuid.v5("synthetic", uuid.v5.DNS, new Uint8Array(8), 4)).toThrow(
    RangeError,
  );
});

it("patched Jaeger propagator handles malformed percent encoded headers", () => {
  const sdkRequire = createRequire(require.resolve("@opentelemetry/sdk-node"));
  const { JaegerPropagator } = sdkRequire("@opentelemetry/propagator-jaeger");
  const { ROOT_CONTEXT, defaultTextMapGetter } =
    sdkRequire("@opentelemetry/api");
  const propagator = new JaegerPropagator();
  for (const carrier of [
    { "uber-trace-id": "%" },
    { "uberctx-user": "%" },
    { "uber-trace-id": "%E0%A4%A", "uberctx-user": "%" },
  ])
    expect(() =>
      propagator.extract(ROOT_CONTEXT, carrier, defaultTextMapGetter),
    ).not.toThrow();
});

it("patched Prometheus HTTP handler returns400 for invalid URI and stays alive", () => {
  const script = `
    const {createRequire}=require('node:module');
    const r=createRequire(process.argv[1]);
    const sr=createRequire(r.resolve('@opentelemetry/sdk-node'));
    const {PrometheusExporter}=sr('@opentelemetry/exporter-prometheus');
    const {createServer,request}=require('node:http');
    const exporter=new PrometheusExporter({preventServerStart:true,host:'127.0.0.1'});
    const server=createServer(exporter._requestHandler);
    const get=(path)=>new Promise((resolve,reject)=>{
      const req=request({host:'127.0.0.1',port:server.address().port,path},res=>{
        res.resume();res.on('end',()=>resolve(res.statusCode));
      });req.on('error',reject);req.end();
    });
    server.listen(0,'127.0.0.1',async()=>{
      try {
        const malformed=await get('http://');
        const subsequent=await get('/still-alive');
        console.log(JSON.stringify({malformed,subsequent}));
        server.close();await exporter.shutdown();
      } catch(error) {console.error(error.name);process.exitCode=1;server.close();}
    });
  `;
  const result = spawnSync(
    process.execPath,
    ["-e", script, functionsManifest],
    {
      timeout: 10_000,
      encoding: "utf8",
      env: { ...process.env, OTEL_METRICS_EXPORTER: "none" },
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout.trim())).toEqual({
    malformed: 400,
    subsequent: 404,
  });
});

it("Genkit Vertex plugin and local flow retain tracing compatibility without model calls", () => {
  const script = `
    const {createRequire}=require('node:module');
    const r=createRequire(process.argv[1]);
    const {genkit,z}=r('genkit');
    const {vertexAI}=r('@genkit-ai/google-genai');
    const {flushTracing}=r('@genkit-ai/core/tracing');
    (async()=>{
      const ai=genkit({promptDir:null,plugins:[vertexAI({projectId:'demo-satsunicgo',location:'asia-southeast1',apiKey:false})]});
      const flow=ai.defineFlow({name:'security022Offline',inputSchema:z.string(),outputSchema:z.string()},async input=>input);
      console.log(await flow('offline-compatible'));
      await flushTracing();process.emit('SIGTERM');
      setTimeout(()=>process.exit(0),100);
    })().catch(error=>{console.error(error.name,error.message);process.exit(1)});
  `;
  const result = spawnSync(
    process.execPath,
    ["-e", script, functionsManifest],
    {
      timeout: 10_000,
      encoding: "utf8",
      env: {
        ...process.env,
        GENKIT_ENV: "prod",
        GOOGLE_APPLICATION_CREDENTIALS:
          "/private/tmp/security022-no-cloud-credentials.json",
        OTEL_TRACES_EXPORTER: "none",
        OTEL_METRICS_EXPORTER: "none",
        OTEL_LOGS_EXPORTER: "none",
      },
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout.trim()).toBe("offline-compatible");
});
