// netlify/functions/latest.js
module.exports.handler = async function () {
  const BASE = process.env.TTS_BASE || "https://eu1.cloud.thethings.network";
  const APP  = process.env.TTS_APP;
  const KEY  = process.env.TTS_KEY;
  if (!APP || !KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta TTS_APP o TTS_KEY" }) };
  }
  try {
    const url = `${BASE}/api/v3/as/applications/${encodeURIComponent(APP)}` +
                `/packages/storage/messages?limit=1&order=-received_at`;
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    const item = Array.isArray(data) ? data[0] : (data.result?.[0] ?? data);
    const up   = item?.result?.uplink_message ?? item?.uplink_message ?? item;
    const dec  = up?.decoded_payload?.fields ?? up?.decoded_payload ?? {};
    const temperature = (dec.temperature != null && !Number.isNaN(+dec.temperature)) ? +dec.temperature : null;
    const humidity    = (dec.humidity    != null && !Number.isNaN(+dec.humidity))     ? +dec.humidity    : null;
    const timeISO     = up?.received_at ?? new Date().toISOString();
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ temperature, humidity, timeISO })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
