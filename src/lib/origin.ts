import { VERSION } from "./version";

/**
 * The deployment the maintainer runs. Rendered documents from any other deployment
 * link to it as the hosted version, but no other deployment presents it as its own
 * origin: each one identifies itself.
 */
export const HOSTED_ORIGIN = "https://hulistmi-ai.y6vd2dkjgb.workers.dev";

/**
 * Points a self-hosted deployment to the hosted version; undefined on the hosted
 * version itself. `link` formats the hosted address for the page it goes in.
 */
export function selfHostedNote(
  origin: string,
  link: (url: string) => string = (url) => url,
): string | undefined {
  if (origin === HOSTED_ORIGIN) return undefined;
  return `This is a self-hosted instance. The hosted version is at ${link(HOSTED_ORIGIN)}.`;
}

export class InvalidOriginError extends Error {}

/**
 * The origin that the setting `name` configures, or undefined when it is not set.
 * A value that is set but is not an http or https URL is a configuration mistake, so
 * it throws instead of falling back to a default the operator did not choose.
 */
export function parsePublicOrigin(
  name: string,
  value: string | undefined,
): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    // Other schemes parse too: "localhost:8787" has the scheme "localhost:" and
    // the origin "null".
    if (url.protocol === "http:" || url.protocol === "https:")
      return url.origin;
  } catch {
    // not a URL at all; reported below
  }
  throw new InvalidOriginError(
    `${name} must be an http or https URL, got: ${candidate}`,
  );
}

/** Without an origin, as from the CLI, the agent names only the software. */
export function hulistmiUserAgent(origin: string | undefined): string {
  const agent = `hulistmi-ai/${VERSION}`;
  return origin ? `${agent} (+${origin}/bot)` : agent;
}
