/**
 * The origin this deployment presents as: it goes in the footer of every rendered
 * document, on the /bot transparency page, and in the outgoing User-Agent.
 *
 * A hard-coded constant meant a self-hosted deployment attributed its documents to
 * someone else's Worker and identified itself to Huawei as that instance. It is now
 * resolved per deployment: the PUBLIC_ORIGIN binding wins, the serving origin is used
 * when there is no binding, and the constant is only the last resort.
 */
export const DEFAULT_PUBLIC_ORIGIN =
  "https://hulistmi-ai.y6vd2dkjgb.workers.dev";

let resolved = DEFAULT_PUBLIC_ORIGIN;

/** Set the origin for this deployment. Ignores anything that is not a valid URL. */
export function configurePublicOrigin(value: string | undefined | null): void {
  const candidate = value?.trim();
  if (!candidate) return;
  try {
    resolved = new URL(candidate).origin;
  } catch {
    // keep whatever was resolved before rather than advertising a broken origin
  }
}

export function publicOrigin(): string {
  return resolved;
}
