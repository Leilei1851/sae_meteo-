export async function handler() {
  try {
    const BASE = process.env.TTS_BASE || 'https://eu1.cloud.thethings.network';
    const APP  = process.env.TTS_APP;
    const KEY  = process.env.TTS_KEY;
    if (!APP || !KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing TTS_APP or TTS_KEY env var' }) };
    }
    // helper para llamar al API de Storage
    async function callStorage(path) {
      const url = `${BASE}/api/v3/as/applications/${encodeURIComponent(APP)}/packages/storage/${path}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${KEY}`,
          'Accept': 'application/json'
        }export async function handler() {
  try {
    const BASE = process.env.TTS_BASE || 'https://eu1.cloud.thethings.network';
    const APP  = process.env.TTS_APP;
    const KEY  = process.env.TTS_KEY;
    if (!APP || !KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing TTS_APP or TTS_KEY env var' }) };
    }
    // helper para llamar al API de Storage
    async function callStorage(path) {
      const url = `${BASE}/api/v3/as/applications/${encodeURIComponent(APP)}/packages/storage/${path}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${KEY}`,
          'Accept': 'application/json'
        }
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`TTS ${res.status} ${res.statusText} :: ${text}`);
      }
      return JSON.parse(text);
    }
    // 1º intento: endpoint genérico de mensajes (más estable)
    let data;
    try {
      data = await callStorage('messages?limit=1&order=desc');
    } catch (e) {
      // 2º intento (algunos clusters exponen esta ruta)
      data = await callStorage('uplink_message?limit=1');
    }
    // Normaliza la forma (lista o objeto)
    const item = Array.isArray(data) ? data[0] : (data.result?.[0] ?? data);
    // Distintas ubicaciones posibles del último uplink
    const up  = item?.result?.uplink_message || item?.uplink_message || item;
    const dec = up?.decoded_payload || up?.payload_fields || {};
    // Tolerante a formatos: temperature/humidity en raíz o en dec.data
    const rawTemp = (typeof dec.temperature === 'number')
                      ? dec.temperature
                      : (typeof dec.data?.temperature === 'number' ? dec.data.temperature : null);
    const rawHum  = (typeof dec.humidity === 'number')
                      ? dec.humidity
                      : (typeof dec.data?.humidity === 'number' ? dec.data.humidity : null);
    // Si tu formatter entrega décimas (e.g. 218.5 = 21.85 ºC), ajusta aquí:
    const temperature = (rawTemp == null) ? null
                        : (rawTemp > 200 ? Math.round(rawTemp) / 10 : rawTemp);
    const humidity    = (rawHum  == null) ? null
                        : (rawHum  > 200 ? Math.round(rawHum)  / 10 : rawHum);
    const timeISO = up?.received_at || item?.received_at || new Date().toISOString();
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify({ temperature, humidity, timeISO })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`TTS ${res.status} ${res.statusText} :: ${text}`);
      }
      return JSON.parse(text);
    }
    // 1º intento: endpoint genérico de mensajes (más estable)
    let data;
    try {
      data = await callStorage('messages?limit=1&order=desc');
    } catch (e) {
      // 2º intento (algunos clusters exponen esta ruta)
      data = await callStorage('uplink_message?limit=1');
    }
    // Normaliza la forma (lista o objeto)
    const item = Array.isArray(data) ? data[0] : (data.result?.[0] ?? data);
    // Distintas ubicaciones posibles del último uplink
    const up  = item?.result?.uplink_message || item?.uplink_message || item;
    const dec = up?.decoded_payload || up?.payload_fields || {};
    // Tolerante a formatos: temperature/humidity en raíz o en dec.data
    const rawTemp = (typeof dec.temperature === 'number')
                      ? dec.temperature
                      : (typeof dec.data?.temperature === 'number' ? dec.data.temperature : null);
    const rawHum  = (typeof dec.humidity === 'number')
                      ? dec.humidity
                      : (typeof dec.data?.humidity === 'number' ? dec.data.humidity : null);
    // Si tu formatter entrega décimas (e.g. 218.5 = 21.85 ºC), ajusta aquí:
    const temperature = (rawTemp == null) ? null
                        : (rawTemp > 200 ? Math.round(rawTemp) / 10 : rawTemp);
    const humidity    = (rawHum  == null) ? null
                        : (rawHum  > 200 ? Math.round(rawHum)  / 10 : rawHum);
    const timeISO = up?.received_at || item?.received_at || new Date().toISOString();
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: JSON.stringify({ temperature, humidity, timeISO })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
