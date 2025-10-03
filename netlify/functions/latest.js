// netlify/functions/latest.js
exports.handler = async function () {
  const BASE = process.env.TTS_BASE || 'https://eu1.cloud.thethings.network';
  const APP  = process.env.TTS_APP;
  const KEY  = process.env.TTS_KEY;
  if (!APP || !KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing TTS_APP or TTS_KEY' }) };
  }
  try {
    // SIN "type=" a propósito
    const url = `${BASE}/api/v3/as/applications/${encodeURIComponent(APP)}` +
                `/packages/storage/messages?limit=1&order=-received_at`;
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' } });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify({ error: data, debugUrl: url }) };
    const item = Array.isArray(data) ? data[0] : (data.result?.[0] ?? data);
    const up   = item?.result?.uplink_message ?? item?.uplink_message ?? item;
    const dec  = up?.decoded_payload?.fields ?? up?.decoded_payload ?? {};
    const toNum = v => (v != null && !Number.isNaN(Number(v))) ? Number(v) : null;
    const temperature = toNum(dec.temperature);
    const humidity    = toNum(dec.humidity);
    const timeISO     = up?.received_at ?? item?.received_at ?? null;
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify({ temperature, humidity, timeISO, debugUrl: url })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
