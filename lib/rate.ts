/**
 * A small limiter for the two auth routes.
 *
 * Deliberately in memory: it is a speed bump for scripts, not a security
 * boundary, and it must not add a database round-trip before every login.
 * On a serverless platform each instance keeps its own counts, so a determined
 * attacker spread across instances gets more tries than the numbers suggest.
 * That is the honest trade: this stops the obvious loop, and Supabase's own
 * limits are the backstop.
 *
 * The window is a fixed hour per key, not a sliding one — simpler to reason
 * about and the difference does not matter at this scale.
 */

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

/** The caller's address, as seen by the platform in front of the app. */
function keyOf(request: Request, scope: string) {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

/**
 * True when the caller has used up its allowance.
 *
 * Counting happens on the first call, so a refused request does not extend
 * the window — otherwise a retrying client could keep itself locked out.
 */
export function tooMany(request: Request, scope: string, limit: number, windowMs: number): boolean {
  const key = keyOf(request, scope);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    /* keep the map from growing without bound on a long-lived instance */
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
    }
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
