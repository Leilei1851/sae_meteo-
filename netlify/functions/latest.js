// /.netlify/functions/get-latest
export async function handler(event) {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    try {
      const TTS_BASE = process.env.TTS_BASE; // p.ej. https://eu1.cloud.thethings.network
      const TTS_APP  = process.env.TTS_APP;  // p.ej. sma
      const TTS_KEY  = process.env.TTS_KEY;  // tu API key NNSXS... con permisos de lectura
      if (!TTS_BASE || !TTS_APP || !TTS_KEY) {
        throw new Error("Faltan TTS_BASE, TTS_APP o TTS_KEY");
      }
      // Lee el último uplink desde la Storage Integration (asegúrate de tenerla habilitada)
      const url = `${TTS_BASE}/api/v3/as/applications/${TTS_APP}/packages/storage/uplink?limit=1`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${TTS_KEY}` } });
      if (!res.ok) throw new Error(`TTS ${res.status} ${res.statusText}`);
      const items = await res.json();
      const last = Array.isArray(items) ? items[0] : items;
      // ⬇️ Ajusta el nombre del campo si tu payload usa otra clave (temp, temp_c, etc.)
      // Ejemplos alternativos al final.
      const temperature =
        last?.result?.decoded_payload?.temperature ??
        last?.result?.uplink_message?.decoded_payload?.temperature ??
        null;
      const timeISO = last?.received_at ?? new Date().toISOString();
      return {
        statusCode: 200,
        body: JSON.stringify({ temperature, timeISO })
      };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }
  /*
  Si en TTS ves el dato como:
  - decoded_payload.temp        → usa last?.result?.decoded_payload?.temp
  - decoded_payload.temp_c      → usa last?.result?.decoded_payload?.temp_c
  - uplink_message.decoded_payload.temperature → usa la segunda opción del OR
  */