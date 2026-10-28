// Public browser configuration only. Never put a secret or service_role key here.
// The event ranking lives in its own Supabase project, separate from the playtest survey
// (playtest-config.js). The game's event branch writes to this same project.
window.EVENT_RANKING_CONFIG = Object.freeze({
  supabaseUrl: 'https://qbaktsjyetnyvmfegwxu.supabase.co',
  supabasePublicKey: 'sb_publishable_cSxHPxODM1I6edbuNpSqdw_Lw3wLf0P'
});
