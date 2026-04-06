import { logger } from './logger.js';

interface RetrieveResponse {
  context_block?: string;
}

const TIMEOUT_MS = 15000;
const TOP_K = 5;
const EVENT_DAYS = 7;

/**
 * Fetch relevant memory context from BearMemori for the given query.
 *
 * Returns the pre-formatted `context_block` string from BearMemori's
 * `/memory/retrieve` endpoint, or `null` if the feature is disabled,
 * the response is empty, or any error occurs.
 *
 * All failures are logged as warnings and swallowed — callers should
 * proceed without memory context when this returns `null`.
 */
export async function fetchMemoryContext(
  query: string,
): Promise<string | null> {
  const baseUrl = process.env.BEARMEMORI_URL;
  if (!baseUrl) return null;

  const url =
    `${baseUrl.replace(/\/$/, '')}/memory/retrieve` +
    `?query_context=${encodeURIComponent(query)}` +
    `&top_k=${TOP_K}` +
    `&event_days=${EVENT_DAYS}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      logger.warn(
        { status: res.status, query },
        'BearMemori returned non-OK status',
      );
      return null;
    }

    const data = (await res.json()) as RetrieveResponse;
    const block = data.context_block?.trim();
    return block && block.length > 0 ? block : null;
  } catch (err) {
    logger.warn({ err, query }, 'BearMemori fetch failed');
    return null;
  }
}
