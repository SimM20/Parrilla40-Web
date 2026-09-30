// Temporary PostgreSQL/WASM database. No Supabase project or credentials needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const packagePath = process.env.PGLITE_MODULE || '@electric-sql/pglite';
const { PGlite } = require(packagePath);
const packageRequire = process.env.PGLITE_MODULE
  ? require('node:module').createRequire(require('node:path').join(packagePath, 'package.json')) : require;
const { pgcrypto } = packageRequire('@electric-sql/pglite/contrib/pgcrypto');

(async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(`create role anon; create role authenticated;
      grant usage on schema public to anon, authenticated;
      alter default privileges in schema public grant all on tables to anon, authenticated;`);
    await db.exec(fs.readFileSync('supabase/setup.sql', 'utf8'));
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('playtest.js', 'utf8'), context);
    const { questions, validate } = context.window.Playtest;
    const values = Object.fromEntries(questions.map(q => [q.name, q.options ? q.options[0][0] : q.type === 'number' ? '2' : 'Una respuesta de prueba']));
    const row = { ...validate(values).answers, session_id: randomUUID(), build_version: 'qa' };
    async function insert(data) {
      const fields = Object.keys(data);
      return db.query(`insert into public.playtest_responses (${fields.join(',')}) values (${fields.map((_, i) => `$${i + 1}`).join(',')})`, Object.values(data));
    }
    await db.exec('set role anon');
    await assert.rejects(db.query('select public.playtest_results($1)', [randomUUID()]), /Access denied/);
    await insert(row);
    for (const sql of [
      'select * from public.playtest_responses',
      "update public.playtest_responses set build_version = 'tampered'",
      'delete from public.playtest_responses',
      'truncate public.playtest_responses',
      'select * from playtest_private.admin_verifier'
    ]) await assert.rejects(db.exec(sql), /permission denied/);
    await assert.rejects(insert({ ...row, created_at: new Date().toISOString() }), /permission denied/);
    await assert.rejects(insert({ ...row, id: randomUUID() }), /permission denied/);
    for (const q of questions) {
      await assert.rejects(insert({ ...row, [q.name]: null }), /not-null constraint/);
      if (q.type === 'rating') {
        for (const value of [0, 6]) await assert.rejects(insert({ ...row, [q.name]: value }), /check constraint/);
      } else if (q.type === 'choice' && q.name !== 'completed_night_1') {
        await assert.rejects(insert({ ...row, [q.name]: 'invalid' }), /check constraint/);
      } else if (q.type === 'text') {
        for (const value of ['', '   ', '\n\t', 'x'.repeat(4001), ' '.repeat(4000) + 'x']) await assert.rejects(insert({ ...row, [q.name]: value }), /check constraint/);
      }
    }
    await assert.rejects(insert({ ...row, highest_night: -1 }), /check constraint/);
    await assert.rejects(insert({ ...row, highest_night: 1.5 }), /invalid input syntax/);
    await assert.rejects(insert({ ...row, highest_night: 2147483648 }), /out of range/);
    await assert.rejects(insert({ ...row, build_version: ' ' }), /check constraint/);
    await db.exec('reset role; set role authenticated');
    await assert.rejects(insert(row), /permission denied/);
    await assert.rejects(db.query('select public.playtest_results($1)', ['denied']), /permission denied/);
    await db.exec('reset role');
    const password = randomUUID();
    await db.query(`insert into playtest_private.admin_verifier (password_hash)
      values (extensions.crypt($1, extensions.gen_salt('bf', 12)))`, [password]);
    await db.exec('set role anon');
    for (const invalid of [randomUUID(), null, '', 'x'.repeat(73)]) {
      await assert.rejects(db.query('select public.playtest_results($1)', [invalid]), /Access denied/);
    }
    const result = await db.query('select public.playtest_results($1) as data', [password]);
    const saved = result.rows[0].data;
    assert.equal(saved.length, 1);
    assert.equal(saved[0].highest_night, 2);
    assert.equal(saved[0].session_id, undefined);
    assert.equal(saved[0].id, undefined);
    assert(Number.isFinite(Date.parse(saved[0].created_at)));
    await db.exec('reset role');
    const policies = await db.query("select cmd from pg_policies where tablename = 'playtest_responses'");
    assert.deepEqual(policies.rows, [{ cmd: 'INSERT' }]);
    const secure = await db.query("select prosecdef, proconfig from pg_proc where oid = 'public.playtest_results(text)'::regprocedure");
    assert.equal(secure.rows[0].prosecdef, true);
    assert(secure.rows[0].proconfig.some(value => value === 'search_path=""'));
    console.log('PASS PostgreSQL: exact setup.sql, anonymous insert, server timestamp, all field constraints, no SELECT/UPDATE/DELETE/TRUNCATE, no verifier access, protected RPC, fail-closed without verifier, wrong/null/oversized password, valid bcrypt password, fixed search_path, minimum payload');
  } finally { await db.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
