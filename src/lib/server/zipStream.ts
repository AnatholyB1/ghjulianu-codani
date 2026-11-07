/**
 * Streaming ZIP in STORE mode (level 0) built on fflate. Pure module (no
 * server-only marker) so it can be exercised with plain node.
 *
 * Memory: the source files are fetched ONE AT A TIME and pushed chunk by chunk;
 * the output is a pull-driven ReadableStream, so at most one upstream chunk
 * plus the zip framing is in memory regardless of the ZIP size.
 */
import { Zip, ZipPassThrough } from 'fflate';

export interface ZipEntry {
  /** File name inside the archive (ASCII). */
  name: string;
  /** Opens the source bytes. Called lazily, only when it is this entry's turn. */
  open: (signal: AbortSignal) => Promise<ReadableStream<Uint8Array>>;
}

export interface ZipStreamOptions {
  signal: AbortSignal;
  /** Called with every chunk handed to the consumer (for byte counting). */
  onChunk?: (bytes: number) => void;
}

async function* zipChunks(entries: ZipEntry[], opts: ZipStreamOptions): AsyncGenerator<Uint8Array> {
  const out: Uint8Array[] = [];
  let failure = null as unknown;
  const zip = new Zip((err, chunk) => {
    if (err) failure = err;
    else out.push(chunk);
  });
  const drain = function* () {
    if (failure) throw failure;
    while (out.length) yield out.shift() as Uint8Array;
  };

  const now = new Date();
  for (const entry of entries) {
    if (opts.signal.aborted) throw new DOMException('aborted', 'AbortError');
    const file = new ZipPassThrough(entry.name);
    file.mtime = now.getTime();
    zip.add(file);
    const body = await entry.open(opts.signal);
    const reader = body.getReader();
    let finished = false;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }
        file.push(value, false);
        yield* drain();
      }
    } finally {
      // Early exit (client gone, error): release the upstream connection.
      if (!finished) await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    file.push(new Uint8Array(0), true);
    yield* drain();
  }
  zip.end();
  yield* drain();
}

/** Pull-driven stream of a ZIP archive. Cancelling it stops fetching sources. */
export function zipReadableStream(entries: ZipEntry[], opts: ZipStreamOptions): ReadableStream<Uint8Array> {
  const it = zipChunks(entries, opts);
  return new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        try {
          const { value, done } = await it.next();
          if (done) controller.close();
          else {
            opts.onChunk?.(value.byteLength);
            controller.enqueue(value);
          }
        } catch (e) {
          controller.error(e);
        }
      },
      async cancel() {
        await it.return(undefined);
      },
    },
    { highWaterMark: 1 },
  );
}

/** Pass-through that counts bytes and reports the total exactly once (end, error or cancel). */
export function countingStream(
  source: ReadableStream<Uint8Array>,
  onDone: (bytes: number, completed: boolean) => void,
): ReadableStream<Uint8Array> {
  let total = 0;
  let reported = false;
  const report = (completed: boolean) => {
    if (reported) return;
    reported = true;
    onDone(total, completed);
  };
  const reader = source.getReader();
  return new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            report(true);
            controller.close();
          } else {
            total += value.byteLength;
            controller.enqueue(value);
          }
        } catch (e) {
          report(false);
          controller.error(e);
        }
      },
      async cancel(reason) {
        // Cancel the source first: nested counters report before this one does.
        try {
          await reader.cancel(reason);
        } finally {
          report(false);
        }
      },
    },
    { highWaterMark: 1 },
  );
}
