/* Kerstkaarten 2026: inloggen en gegevens via Supabase (project Database V1, schema kerstkaarten_2026).
   - Inloggen gaat met het centrale Blom-account. De pagina staat op hetzelfde adres als de startpagina
     (blominterieurs.github.io/...) en deelt daardoor de inlog: wie op de startpagina of in een andere
     Blom-app is ingelogd, is hier automatisch ingelogd, en andersom.
   - Toegang heeft wie een account heeft en voor wie de kerstkaarten zichtbaar zijn gezet
     (schema gebruikersbeheer); beheerders zien altijd alles.
   - De relatiegegevens staan niet in de pagina: ze komen na het inloggen uit de database
     (kerstkaarten_2026_gegevens). Aanpassingen en toegevoegde kaarten gaan via
     kerstkaarten_2026_lees en kerstkaarten_2026_zet. */
(function () {
  const CFG = window.KERST_CONFIG;
  const DOMEIN = (CFG.domein || '@blominterieurs.nl').toLowerCase();
  // standaard opslagsleutel van Supabase: dezelfde als de startpagina en de andere apps, dus één gedeelde inlog
  const sb = window.supabase.createClient(CFG.url, CFG.sleutel, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = id => document.getElementById(id);
  const isBlom = u => !!(u && u.email && u.email.toLowerCase().endsWith(DOMEIN));

  function norm(e) {
    const msg = (e && e.message) || 'onbekende fout';
    const err = new Error(msg);
    // de pagina toont bij 'invalid_argument' de melding "Je hebt geen rechten ..."
    err.code = (e && e.code === '42501') || /not_granted|permission|JWT/i.test(msg) ? 'invalid_argument' : 'unknown';
    return err;
  }

  /* ---------- aanpassingen: zelfde vorm als de database van de Claude-artifact ---------- */
  const SOORTEN = ['wijz', 'nieuw'];
  let stand = null, luisteraars = [];

  const momentopname = soort => ({
    docs: Object.entries(stand[soort] || {}).map(([id, d]) => ({ id, data: () => d })),
    metadata: { fromCache: false }
  });
  async function laad() {
    const { data, error } = await sb.rpc('kerstkaarten_2026_lees');
    if (error) { const f = norm(error); luisteraars.forEach(l => l.fout && l.fout(f)); throw f; }
    stand = data || {};
    luisteraars.forEach(l => l.cb(momentopname(l.soort)));
  }
  async function zet(pad, data, samenvoegen) {
    const [soort, id] = String(pad).split('/');
    if (!SOORTEN.includes(soort) || !id) throw new Error('Onbekend document ' + pad);
    const { error } = await sb.rpc('kerstkaarten_2026_zet', { p_soort: soort, p_id: id, p_data: data, p_samenvoegen: samenvoegen });
    if (error) throw norm(error);
    await laad().catch(() => {});
  }
  const DB = {
    collection(soort) {
      if (!SOORTEN.includes(soort)) throw new Error('Onbekende collectie ' + soort);
      return {
        onSnapshot(cb, fout) {
          const l = { soort, cb, fout };
          luisteraars.push(l);
          if (stand) cb(momentopname(soort));
          return () => { luisteraars = luisteraars.filter(x => x !== l); };
        }
      };
    },
    doc(pad) { return { set: d => zet(pad, d, false), update: d => zet(pad, d, true) }; }
  };

  /* ---------- inlogscherm ---------- */
  function scherm(tekst, soort) {
    // soort: 'wacht' (alleen tekst), 'inloggen' (formulier), 'geen' (tekst en uitloggen)
    $('lgUitleg').textContent = tekst;
    $('lgVelden').hidden = soort !== 'inloggen';
    $('lgUit').hidden = soort !== 'geen';
    document.body.classList.add('dicht');
    if (soort === 'inloggen') $('lgMail').focus();
  }

  let gestart = false, email = null;
  async function ga(user) {
    if (gestart) return;
    gestart = true; email = user.email.toLowerCase();
    const meta = user.user_metadata || {};
    if (meta.wachtwoord_wijzigen || !meta.wachtwoord) {
      scherm('Kies eerst een eigen wachtwoord op de startpagina. Kom daarna hier terug.', 'geen'); return;
    }
    scherm('Kerstkaarten laden…', 'wacht');
    const { data, error } = await sb.rpc('kerstkaarten_2026_gegevens');
    if (error || !data || !Array.isArray(data.kaarten)) {
      const f = error ? norm(error) : null;
      scherm(f && f.code === 'invalid_argument'
        ? email + ' heeft geen toegang tot de kerstkaarten. Vraag een beheerder om je toe te voegen.'
        : 'De kerstkaarten konden niet worden geladen. Probeer het zo nog eens.', 'geen');
      return;
    }
    window.GEGEVENS = data;
    $('uitleg').innerHTML = data.uitleg || '';   // tekst uit de eigen database, door Blom zelf geschreven
    $('lgTekst').textContent = 'Ingelogd als ' + email;
    $('login').hidden = false;
    document.body.classList.remove('dicht');
    const s = document.createElement('script');   // de pagina zelf start pas nu, met de gegevens
    s.src = 'js/app.js';
    document.body.appendChild(s);
  }

  window.KERST = {
    // js/app.js roept dit aan zodra de pagina is opgebouwd
    async koppel(start) {
      // alleen lezen of ook bewerken: per persoon ingesteld in het gebruikersbeheer (de database controleert het ook)
      const { data: magBewerken } = await sb.rpc('mag_app_bewerken', { p_app: 'kerstkaarten-2026' });
      if (magBewerken !== true) $('lgTekst').textContent = 'Ingelogd als ' + email + ' · alleen lezen';
      const gebruiker = { id: async () => email, can: async () => magBewerken === true, profiles: async () => ({}) };
      await laad().catch(() => {});
      await start(DB, gebruiker);
      // collega's passen ook aan: elke 20 seconden opnieuw ophalen zolang het tabblad zichtbaar is
      setInterval(() => { if (document.visibilityState === 'visible') laad().catch(() => {}); }, 20000);
    }
  };

  $('lgForm').addEventListener('submit', async e => {
    e.preventDefault();
    const mail = $('lgMail').value.trim().toLowerCase(), ww = $('lgWw').value;
    if (!mail.endsWith(DOMEIN)) { $('lgFout').textContent = 'Alleen adressen eindigend op ' + DOMEIN + ' hebben toegang.'; return; }
    if (!ww) { $('lgFout').textContent = 'Vul je wachtwoord in.'; return; }
    $('lgOk').disabled = true; $('lgFout').textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email: mail, password: ww });
    $('lgOk').disabled = false; $('lgWw').value = '';
    if (error) $('lgFout').textContent = /invalid/i.test(error.message) ? 'E-mailadres of wachtwoord klopt niet.' : 'Inloggen lukte niet. Probeer het zo nog eens.';
  });
  const uit = async () => { await sb.auth.signOut(); location.reload(); };
  $('lgUit').onclick = uit; $('lgKnop').onclick = uit;

  (async function start() {
    // niet rechtstreeks in de callback met Supabase praten: eerst de callback laten aflopen
    sb.auth.onAuthStateChange((gebeurtenis, s) => {
      if (s && isBlom(s.user)) setTimeout(() => ga(s.user), 0);
      else if (gebeurtenis === 'SIGNED_OUT' && gestart) location.reload();   // elders uitgelogd
    });
    const { data } = await sb.auth.getSession();
    const s = data && data.session;
    if (s && isBlom(s.user)) ga(s.user);
    else scherm('Log in met je Blom-account. Daarmee ben je meteen ingelogd in alle Blom-apps.', 'inloggen');
  })();
})();
