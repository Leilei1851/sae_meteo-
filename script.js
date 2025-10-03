async function fetchLatest() {
  const r = await fetch('/.netlify/functions/latest?ts=' + Date.now(), { cache: 'no-store' });
  const json = await r.json();
  document.getElementById('temp').textContent = (typeof json.temperature === 'number') ? json.temperature : '--';
  document.getElementById('hum').textContent  = (typeof json.humidity === 'number') ? json.humidity  : '--';
  document.getElementById('time').textContent = json.timeISO ? new Date(json.timeISO).toLocaleString() : '--';
}
document.getElementById('refresh').addEventListener('click', fetchLatest);
fetchLatest();
// 15 segundos (<= 4 llamadas/min)
setInterval(fetchLatest, 15000););
 
