// netlify/functions/latest.js
exports.handler = async function () {
  const BASE = process.env.TTS_BASE || 'https://eu1.cloud.thethings.network';
  const APP  = process.env.TTS_APP;
  const KEY  = process.env.TTS_KEY;
  if (!APP || !KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing TTS_APP or TTS_KEY' }) };
  }
  try {
    // Construimos la URL con URL(), solo con limit=1 y NOS ASEGURAMOS de eliminar "type"
    const u = new URL(`${BASE}/api/v3/as/applications/${encodeURIComponent(APP)}/packages/storage/messages`);
    u.searchParams.set('limit', '1');
    u.searchParams.delete('type');   // <- por si algún rewrite lo añade
    // Si quieres forzar orden, descomenta la siguiente línea:
    // u.searchParams.set('order', '-received_at');
    const requestUrl = u.toString();
    const res  = await fetch(requestUrl, {
      headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' }
    });
    // URL efectiva después de redirecciones (si las hubiera)
    const effectiveUrl = res.url;
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data, debug: { requestUrl, effectiveUrl } })
      };
    }
    // Normalización mínima
    const list = Array.isArray(data) ? data : (Array.isArray(data.result) ? data.result : []);
    if (list.length === 0) {
      return {
        statusCode: 204,
        body: JSON.stringify({ error: 'No messages in Storage', debug: { requestUrl, effectiveUrl } })
      };
    }
    const item = list[0];
    const up   = item?.result?.uplink_message ?? item?.uplink_message ?? item;
    const dec  = up?.decoded_payload?.fields ?? up?.decoded_payload ?? {};
    const toNum = v => (v != null && !Number.isNaN(Number(v))) ? Number(v) : null;
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify({
        temperature: toNum(dec.temperature),
        humidity:    toNum(dec.humidity),
        timeISO:     up?.received_at ?? item?.received_at ?? null,
        debug:       { requestUrl, effectiveUrl }
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
