
exports.handler = async function () {
  try {
    const BASE = process.env.TTS_BASE || 'https://eu1.cloud.thethings.network';
    const APP  = process.env.TTS_APP;
    const KEY  = process.env.TTS_KEY; // NNSXS...
    if (!APP || !KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing TTS_APP or TTS_KEY env var' })
      };
    }
    const url = `${BASE}/api/v3/as/applications/${encodeURIComponent(APP)}/packages/storage/uplink_message?limit=1`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `TTS ${res.status} ${res.statusText}`, details: text })
      };
    }
    const raw = await res.json();
    const list =
      Array.isArray(raw) ? raw :
      Array.isArray(raw.data) ? raw.data :
      Array.isArray(raw.result) ? raw.result :
      (raw.data && Array.isArray(raw.data.result)) ? raw.data.result :
      (raw.result && Array.isArray(raw.result.result)) ? raw.result.result :
      [];
    const last = list[0] || raw?.result?.[0] || raw?.data?.result?.[0] || raw;
    const up =
      last?.result?.uplink_message ||
      last?.uplink_message ||
      last;
    const dec =
      up?.decoded_payload ||
      up?.payload?.fields ||
      up?.decoded_payload?.data ||
      up?.payload?.fields?.data ||
      {};
    const pick = (a, b) => a !== undefined ? a : b;
    const tRaw = pick(dec.temperature, dec.data?.temperature);
    const hRaw = pick(dec.humidity,    dec.data?.humidity);
    const toNum = v => (v !== undefined && v !== null && !Number.isNaN(Number(v))) ? Number(v) : null;
    const temperature = toNum(tRaw);
    const humidity    = toNum(hRaw);
    const timeISO     = up?.received_at || last?.received_at || new Date().toISOString();
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store'
      },
      body: JSON.stringify({ temperature, humidity, timeISO })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
