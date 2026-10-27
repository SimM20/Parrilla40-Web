(function () {
  'use strict';
  const { getClient, element } = window.Playtest;
  const list = document.querySelector('#ranking');
  const status = document.querySelector('#ranking-status');
  // The page stays open on a screen during the event: refresh without reloading.
  const REFRESH_MS = 20000;
  let loading = false, loadedOnce = false;
  const money = value => '$' + value.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  const time = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const isRow = row => row && typeof row.player_name === 'string' && row.player_name.trim() &&
    Number.isInteger(row.total_earned) && row.total_earned >= 0 && Number.isInteger(row.runs) && row.runs > 0;

  function render(rows) {
    list.replaceChildren();
    rows.forEach((row, index) => {
      const item = element('li', undefined, index < 3 ? `ranking-row ranking-row--top${index + 1}` : 'ranking-row');
      const runs = row.runs === 1 ? '1 run' : `${row.runs} runs`;
      const who = element('span', undefined, 'ranking-who');
      who.append(element('strong', row.player_name, 'ranking-name'), element('span', runs, 'ranking-runs'));
      item.append(element('span', String(index + 1), 'ranking-pos'), who, element('span', money(row.total_earned), 'ranking-money'));
      list.append(item);
    });
  }
  async function load() {
    if (loading || document.hidden) return;
    loading = true;
    try {
      const { data, error } = await getClient().rpc('event_leaderboard_top').abortSignal(AbortSignal.timeout(15000));
      if (error) throw error;
      if (!Array.isArray(data) || !data.every(isRow)) throw new Error('Unexpected leaderboard payload');
      render(data);
      loadedOnce = true;
      status.textContent = data.length
        ? `Actualizado a las ${time()}. Se actualiza solo.`
        : 'Todavía no jugó nadie. ¡Sé la primera parrilla del ranking!';
    } catch (error) {
      // Keep the last good ranking on screen; just say it may be stale.
      status.textContent = loadedOnce
        ? `No pudimos actualizar (${time()}). Reintentamos en unos segundos.`
        : 'No pudimos cargar el ranking. Revisá tu conexión; reintentamos en unos segundos.';
    } finally {
      loading = false;
    }
  }
  load();
  setInterval(load, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
})();
