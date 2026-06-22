/**
 * Browser-side SSE parser.
 *
 * We use `fetch + ReadableStream` instead of the built-in `EventSource` because:
 * - The AI Match stream is `POST` with a JSON body.
 * - It needs `Authorization: Bearer <token>` on every request.
 * - We need to cancel mid-stream via an `AbortSignal`.
 *
 * `EventSource` supports none of that.
 */

export interface SSEEvent<T = unknown> {
  event: string;
  data: T;
}

export async function* parseSSE<T = unknown>(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent<T>> {
  if (!response.body) {
    throw new Error("Response has no body — SSE not supported");
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader();

  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;

      // SSE event boundary: blank line. We split on \n\n; lines inside an
      // event are separated by single \n. Servers may send \r\n; we
      // normalise here so the parsing below stays simple.
      buffer = buffer.replace(/\r\n/g, "\n");

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        let eventType = "message";
        let dataLine = "";
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            // Per spec multiple data: lines concatenate with \n. We keep
            // it simple and concatenate raw — JSON.parse handles either.
            dataLine += (dataLine ? "\n" : "") + line.slice(5).trim();
          }
        }
        if (dataLine) {
          try {
            yield { event: eventType, data: JSON.parse(dataLine) as T };
          } catch {
            // Drop malformed frames silently; an upstream typo shouldn't kill
            // the whole stream.
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
  }
}
