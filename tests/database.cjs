// Execute the exact SQL in disposable PostgreSQL/WASM; never touch production data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes, createHash } = require('node:crypto');
const packagePath = process.env.PGLITE_MODULE || '@electric-sql/pglite';
const { PGlite } = require(packagePath);
const packageRequire = process.env.PGLITE_MODULE
  ? require('node:module').createRequire(path.join(packagePath, 'package.json')) : require;
const { pgcrypto } = packageRequire('@electric-sql/pglite/contrib/pgcrypto');

(async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(`create role anon; create role authenticated;
      grant usage on schema public to anon, authenticated;
      alter default privileges in schema public grant all on tables to anon, authenticated;`);
    await db.exec(fs.readFileSync('supabase/setup.sql', 'utf8'));
    await db.exec(fs.readFileSync('supabase/launch-notify.sql', 'utf8'));
    // Historical fixtures are deliberately independent of the new questionnaire.
    const historicalId = randomUUID();
    await db.query(`insert into public.playtest_responses
      (id, session_id, build_version, completed_night_1, completed_night_2, highest_night,
       initial_understanding, controls_intuitiveness, cooking_understanding, heat_understanding,
       order_readability, difficulty_fairness, customer_pacing, learning_feeling,
       stress_experience, want_to_continue, favorite_part, one_thing_to_change)
      values ($1, $2, 'historical-build', true, 'yes', 2, 3, 3, 3, 3, 3, 3, 'good', 3,
        'balanced', 'yes', 'Historical favorite', 'Historical change')`, [historicalId, randomUUID()]);
    await db.exec(`insert into public.launch_notify_signups (email, language)
      values ('old@example.com', 'es'), ('old@example.com', 'en')`);
    const migration = fs.readdirSync('supabase/migrations')
      .find(file => file.endsWith('_playtest_three_questions_and_consent.sql'));
    assert(migration, 'CLI-generated v2 migration exists');
    // The original production install has no old email table and broad table grants.
    const original = new PGlite({ extensions: { pgcrypto } });
    try {
      await original.exec('create role anon; create role authenticated; grant usage on schema public to anon, authenticated;');
      await original.exec(fs.readFileSync('supabase/setup.sql', 'utf8'));
      await original.exec('grant all on public.playtest_responses to anon, authenticated;');
      await original.exec(fs.readFileSync(path.join('supabase/migrations', migration), 'utf8'));
      assert.equal((await original.query("select to_regclass('public.launch_notice_consents') is not null as ready")).rows[0].ready, true);
      for (const role of ['anon', 'authenticated']) {
        const privileges = (await original.query(`select has_table_privilege($1,'public.playtest_responses','SELECT') as can_read,
          has_table_privilege($1,'public.playtest_responses','UPDATE') as can_update,
          has_table_privilege($1,'public.playtest_responses','DELETE') as can_delete`, [role])).rows[0];
        assert.deepEqual(privileges, { can_read: false, can_update: false, can_delete: false });
      }
    } finally { await original.close(); }
    await db.exec(fs.readFileSync(path.join('supabase/migrations', migration), 'utf8'));
    const legacyRoleMigration = fs.readdirSync('supabase/migrations')
      .find(file => file.endsWith('_restrict_legacy_results_role.sql'));
    assert(legacyRoleMigration, 'CLI-generated legacy permission migration exists');
    await db.exec('grant execute on function public.playtest_results(text) to authenticated;');
    await db.exec(fs.readFileSync(path.join('supabase/migrations', legacyRoleMigration), 'utf8'));
    assert.equal((await db.query("select has_function_privilege('authenticated','public.playtest_results(text)','EXECUTE') as allowed")).rows[0].allowed, false);

    const token = () => randomBytes(32).toString('hex');
    const response = [randomUUID(), 'qa-build', 4, 'another_night', 'The last order'];
    const submit = (values = response) => db.query(
      'select public.submit_playtest_v2($1::uuid, $2::text, $3::integer, $4::text, $5::text)', values);
    const subscribe = (email, withdrawalToken, language = 'es', consent = true, version = 'steam-wishlist-v1') => db.query(
      'select public.subscribe_launch_notice($1, $2, $3, $4, $5)', [email, language, version, consent, withdrawalToken]);
    const revoke = withdrawalToken => db.query('select public.revoke_launch_notice($1)', [withdrawalToken]);
    const results = password => db.query('select public.playtest_results_v2($1) as data', [password]);
    const count = async table => Number((await db.query(`select count(*) from public.${table}`)).rows[0].count);

    await db.exec('set role anon');
    await assert.rejects(results(randomUUID()), /Access denied/, 'fails closed before verifier setup');
    await submit();
    await submit(); // A lost acknowledgement and retry must not create a second row.
    await assert.rejects(submit([...response.slice(0, 2), 5, ...response.slice(3)]), /Submission already recorded/);
    const blank = [randomUUID(), 'qa-build', 1, 'prefer_stop', ''];
    await submit(blank);
    await submit([blank[0], ...blank.slice(1, 4), null]); // Both mean no optional answer.
    await submit([randomUUID(), 'qa-build', 2, 'unsure', '🔥'.repeat(1200)]);
    for (const feeling of ['retry_better', 'enough_for_now']) {
      await submit([randomUUID(), 'other-build', 3, feeling, null]);
    }
    for (const index of [0, 1, 2, 3]) {
      const invalid = [...response]; invalid[0] = randomUUID(); invalid[index] = null;
      await assert.rejects(submit(invalid), /not-null constraint/);
    }
    for (const value of [0, 6]) {
      await assert.rejects(submit([randomUUID(), 'qa', value, 'unsure', null]), /check constraint/);
    }
    await assert.rejects(submit([randomUUID(), 'qa', 1.5, 'unsure', null]), /invalid input syntax/);
    await assert.rejects(submit([randomUUID(), 'qa', 3, 'invented', null]), /check constraint/);
    for (const build of ['', '   ', '\n\t', 'x'.repeat(101)]) {
      await assert.rejects(submit([randomUUID(), build, 3, 'unsure', null]), /check constraint|Invalid response/);
    }
    for (const text of ['x'.repeat(1201), ' '.repeat(1200) + 'x']) {
      await assert.rejects(submit([randomUUID(), 'qa', 3, 'unsure', text]), /Invalid response/);
    }
    const firstToken = token(), otherToken = token();
    await subscribe(' New@Example.com ', firstToken);
    await subscribe('new@example.com', firstToken);
    await subscribe('new@example.com', otherToken, 'en'); // Does not rotate deletion authority.
    for (const invalid of ['', 'x@y', 'a b@x.com', null, 'x'.repeat(250) + '@x.com']) {
      await assert.rejects(subscribe(invalid, token()), /check constraint|not-null constraint|Invalid consent/);
    }
    for (const consent of [false, null]) await assert.rejects(subscribe('a@b.com', token(), 'es', consent), /Invalid consent/);
    for (const version of ['other-purpose', null]) await assert.rejects(subscribe('a@b.com', token(), 'es', true, version), /Invalid consent/);
    for (const language of ['fr', null]) await assert.rejects(subscribe('a@b.com', token(), language), /check constraint|not-null constraint/);
    for (const invalid of ['', null, 'a'.repeat(63), 'a'.repeat(65), 'G'.repeat(64)]) {
      await assert.rejects(subscribe('a@b.com', invalid), /Invalid consent/);
      await assert.rejects(revoke(invalid), /Invalid withdrawal token/);
    }
    for (const table of ['playtest_responses_v2', 'launch_notice_consents', 'playtest_responses', 'launch_notify_signups']) {
      for (const sql of [
        `select * from public.${table}`, `delete from public.${table}`,
        `truncate public.${table}`, `insert into public.${table} default values`
      ]) await assert.rejects(db.exec(sql), /permission denied/);
    }
    await assert.rejects(db.exec("update public.playtest_responses_v2 set build_version = 'tampered'"), /permission denied/);
    await assert.rejects(db.exec("update public.launch_notice_consents set email = 'tampered@x.com'"), /permission denied/);
    await assert.rejects(db.exec('select * from playtest_private.admin_verifier'), /permission denied/);
    // Column-level grants from V1 must be closed, not just table-level INSERT.
    await assert.rejects(db.exec("insert into public.launch_notify_signups (email, language) values ('x@y.com', 'es')"), /permission denied/);
    await assert.rejects(db.query("insert into public.playtest_responses (session_id, build_version) values ($1, 'old')", [randomUUID()]), /permission denied/);

    await db.exec('reset role');
    assert.equal(await count('playtest_responses_v2'), 5);
    assert.equal(await count('playtest_responses'), 1);
    assert.equal(await count('launch_notify_signups'), 2);
    assert.equal(await count('launch_notice_consents'), 1);
    const signup = (await db.query('select * from public.launch_notice_consents')).rows[0];
    assert.equal(signup.email, 'new@example.com');
    assert.equal(signup.language, 'es');
    assert.equal(signup.consent, true);
    assert.equal(signup.consent_version, 'steam-wishlist-v1');
    assert.equal(signup.withdrawal_token_hash, createHash('sha256').update(firstToken).digest('hex'));
    assert(!JSON.stringify(signup).includes(firstToken));
    assert(!('session_id' in signup));
    assert(!('response_id' in signup));
    assert(Number.isFinite(Date.parse(signup.created_at)));

    // RLS remains deny-all even if an operator accidentally grants SELECT.
    await db.exec('grant select on public.playtest_responses_v2, public.launch_notice_consents to anon; set role anon');
    assert.equal((await db.query('select * from public.playtest_responses_v2')).rows.length, 0);
    assert.equal((await db.query('select * from public.launch_notice_consents')).rows.length, 0);
    await db.exec('reset role; revoke select on public.playtest_responses_v2, public.launch_notice_consents from anon');
    const password = randomUUID();
    await db.query(`insert into playtest_private.admin_verifier (password_hash)
      values (extensions.crypt($1, extensions.gen_salt('bf', 12)))`, [password]);
    await db.exec('set role anon');
    for (const invalid of [randomUUID(), null, '', 'x'.repeat(73)]) await assert.rejects(results(invalid), /Access denied/);
    const data = (await results(password)).rows[0].data;
    assert.equal(data.length, 5);
    for (const row of data) {
      assert.deepEqual(Object.keys(row).sort(), ['build_version', 'created_at', 'memorable_moment', 'perceived_time_flow', 'post_session_feeling']);
      assert(Number.isFinite(Date.parse(row.created_at)));
    }
    const old = (await db.query('select public.playtest_results($1) as data', [password])).rows[0].data;
    assert.equal(old.length, 1);
    assert.equal(old[0].favorite_part, 'Historical favorite');
    assert.equal(old[0].build_version, 'historical-build');
    await revoke(otherToken);
    await db.exec('reset role');
    assert.equal(await count('launch_notice_consents'), 1, 'duplicate-signup token cannot delete an existing consent');
    await db.exec('set role anon');
    await revoke(firstToken);
    await revoke(firstToken);
    await db.exec('reset role');
    assert.equal(await count('launch_notice_consents'), 0);
    assert.equal((await db.query('select id from public.playtest_responses')).rows[0].id, historicalId);
    assert.equal(await count('launch_notify_signups'), 2);

    await db.exec('set role authenticated');
    await assert.rejects(submit(), /permission denied/);
    await assert.rejects(results(password), /permission denied/);
    await assert.rejects(subscribe('a@b.com', token()), /permission denied/);
    await assert.rejects(revoke(token()), /permission denied/);
    await assert.rejects(db.query('select public.playtest_results($1)', [password]), /permission denied/);
    await db.exec('reset role');
    for (const signature of [
      'public.submit_playtest_v2(uuid,text,integer,text,text)', 'public.playtest_results_v2(text)',
      'public.subscribe_launch_notice(text,text,text,boolean,text)', 'public.revoke_launch_notice(text)'
    ]) {
      const fn = (await db.query('select prosecdef, proconfig from pg_proc where oid = $1::regprocedure', [signature])).rows[0];
      assert.equal(fn.prosecdef, true);
      assert(fn.proconfig.includes('search_path=""'));
      const privilege = (await db.query(`select has_function_privilege('anon', $1, 'EXECUTE') as anon,
        has_function_privilege('authenticated', $1, 'EXECUTE') as authenticated`, [signature])).rows[0];
      assert.deepEqual(privilege, { anon: true, authenticated: false });
    }
    const rls = (await db.query(`select relname, relrowsecurity from pg_class
      where oid in ('public.playtest_responses_v2'::regclass, 'public.launch_notice_consents'::regclass)`)).rows;
    assert.equal(rls.length, 2);
    assert(rls.every(row => row.relrowsecurity));
    console.log('PASS PostgreSQL: exact additive migration; history intact; v2 constraints; optional/Unicode text; idempotent retries; changed payload rejected; consent evidence and deduplication; hashed withdrawal token and secure deletion; legacy writes closed; RLS deny-all and no table access; bcrypt results gate; minimum result payload; fixed search_path; least-privilege RPC grants.');
  } finally { await db.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
