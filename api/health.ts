export default async function handler() {
  return new Response(
    JSON.stringify({ ok: true, service: "vortexcore", time: new Date().toISOString() }),
    { headers: { "content-type": "application/json" } }
  );
}
