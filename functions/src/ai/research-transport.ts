import { getApp } from "firebase-admin/app";
import { researchGeminiLimits } from "./research-gemini";
/** Lazy runtime credentials, fixed POST endpoints, bounded reads, no retry. */
export function vertexResearchTransport() {
  const base = `https://${researchGeminiLimits.location}-aiplatform.googleapis.com/v1/projects/${researchGeminiLimits.project}/locations/${researchGeminiLimits.location}/publishers/google/models/${researchGeminiLimits.model}`;
  return {
    async send(
      url: string,
      body: string,
      signal: AbortSignal,
    ): Promise<unknown> {
      if (
        process.env.GCLOUD_PROJECT !== researchGeminiLimits.project ||
        ![`${base}:countTokens`, `${base}:generateContent`].includes(url)
      )
        throw Error("RESEARCH_TRANSPORT_UNAVAILABLE");
      signal.throwIfAborted();
      const credential = getApp().options.credential;
      if (!credential) throw Error("RESEARCH_TRANSPORT_UNAVAILABLE");
      const token = await credential.getAccessToken();
      signal.throwIfAborted();
      if (Date.now() >= researchGeminiLimits.pricingExpiresAt)
        throw Error("RESEARCH_PRICING_EXPIRED");
      const response = await fetch(url, {
        method: "POST",
        redirect: "error",
        signal,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
        body,
      });
      if (!response.ok || !response.body)
        throw Error("RESEARCH_TRANSPORT_UNAVAILABLE");
      const reader = response.body.getReader();
      let size = 0,
        text = "";
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > 150000) throw Error("RESEARCH_RESPONSE_TOO_LARGE");
          text += decoder.decode(chunk.value, { stream: true });
        }
        return JSON.parse(text + decoder.decode()) as unknown;
      } finally {
        await reader.cancel().catch(() => {});
      }
    },
    async redirect(uri: string, signal: AbortSignal) {
      // resolveGroundingRedirect validates the fixed Google surface before this.
      const url = new URL(uri);
      if (
        url.origin !== "https://vertexaisearch.cloud.google.com" ||
        url.search ||
        url.hash ||
        !/^\/grounding-api-redirect\/[A-Za-z0-9_-]{10,4000}$/.test(url.pathname)
      )
        throw Error("RESEARCH_REDIRECT_DENIED");
      const response = await fetch(uri, {
        method: "GET",
        redirect: "manual",
        signal,
      });
      await response.body?.cancel();
      return [301, 302, 303, 307, 308].includes(response.status)
        ? response.headers.get("location")
        : null;
    },
  };
}
