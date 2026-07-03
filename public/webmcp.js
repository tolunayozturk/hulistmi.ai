export async function connect() {
  return fetch("/webmcp/manifest.json").then((response) => response.json());
}
