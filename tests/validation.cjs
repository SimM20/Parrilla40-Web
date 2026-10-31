const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('playtest.js', 'utf8'), context);
const { questions, validate, launchEmail } = context.window.Playtest;
assert.deepEqual(Array.from(questions, q => q.name), ['perceived_time_flow', 'post_session_feeling', 'memorable_moment']);
assert.equal(Object.keys(validate({}).errors).length, 2);
const values = { perceived_time_flow: '3', post_session_feeling: 'enough_for_now', memorable_moment: '' };
assert.equal(Object.keys(validate(values).errors).length, 0);
assert.equal(validate(values).answers.memorable_moment, null);
for (const q of questions.filter(q => q.options)) {
  assert.equal(q.options.length, 5);
  for (const [option] of q.options) {
    const result = validate({ ...values, [q.name]: option });
    assert.equal(Object.keys(result.errors).length, 0);
    assert.equal(result.answers[q.name], q.name === 'perceived_time_flow' ? Number(option) : option);
  }
  for (const invalid of ['', '0', '6', '1.5', 'unknown']) assert(validate({ ...values, [q.name]: invalid }).errors[q.name]);
}
assert.equal(validate({ ...values, memorable_moment: '  recuerdo  ' }).answers.memorable_moment, 'recuerdo');
assert(!validate({ ...values, memorable_moment: 'x'.repeat(1200) }).errors.memorable_moment);
assert(validate({ ...values, memorable_moment: 'x'.repeat(1201) }).errors.memorable_moment);
assert(!validate({ ...values, memorable_moment: '😀'.repeat(600) }).errors.memorable_moment);
assert(validate({ ...values, memorable_moment: '😀'.repeat(1201) }).errors.memorable_moment);
const answers = validate({ ...values, email: 'never@store.example', launch_notify: 'true' }).answers;
assert.equal(Object.keys(answers).length, 3);
for (const invalid of ['', 'vos', 'vos@ejemplo', 'vos @ejemplo.com', 'x'.repeat(251) + '@b.c']) assert.equal(launchEmail(invalid), null);
assert.equal(launchEmail(' Vos@Ejemplo.com '), 'vos@ejemplo.com');
for (const file of ['index.html', 'en/index.html', 'preguntas/index.html', 'preguntas/en/index.html', 'wishlist/index.html', 'wishlist/en/index.html']) {
  assert(!fs.readFileSync(file, 'utf8').includes('/resultados/'));
}
console.log('PASS: exactly three questions, all categories, required/optional fields, 1200-character boundary, anonymous payload and email validation');
