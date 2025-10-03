
async function fetchLatest() {
  try {
    const r = await fetch('/.netlify/functions/latest', { cache: 'no-store' });
    const json = await r.json(); // { temperature, humidity, timeISO }
    document.getElementById('temp').textContent = 
      (typeof json.temperature === 'number') ? json.temperature.toFixed(1) : '--';
    document.getElementById('hum').textContent  = 
      (typeof json.humidity === 'number') ? json.humidity.toFixed(1) : '--';
    document.getElementById('time').textContent = 
      json.timeISO ? new Date(json.timeISO).toLocaleString() : '--';
  } catch (e) {
    document.getElementById('temp').textContent = '--';
    document.getElementById('hum').textContent  = '--';
    document.getElementById('time').textContent = 'Error';
  }
}
// botón manual + actualización periódica
document.getElementById('refresh').addEventListener('click', fetchLatest);
fetchLatest();
setInterval(fetchLatest, 5000);
 