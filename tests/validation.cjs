const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('playtest.js', 'utf8'), context);
const { questions, validate } = context.window.Playtest;
assert.equal(questions.length, 16);
assert.equal(new Set(questions.map(q => q.name)).size, 16);
assert.equal(Object.keys(validate({}).errors).length, 16);
const values = Object.fromEntries(questions.map(q => [q.name, q.options ? q.options[0][0] : q.type === 'number' ? '0' : 'Texto']));
values.launch_email = 'Vos@Ejemplo.com ';
for (const q of questions.filter(item => item.name !== 'launch_notify')) {
  if (q.options) for (const [option] of q.options) {
    const result = validate({ ...values, [q.name]: option });
    assert.equal(Object.keys(result.errors).length, 0);
    assert.equal(result.answers[q.name], q.type === 'rating' ? Number(option) : q.name === 'completed_night_1' ? option === 'true' : option);
  }
  if (q.type === 'rating') {
    assert(q.low && q.high);
    for (const invalid of ['0', '6', '1.5', 'invalid']) assert(validate({ ...values, [q.name]: invalid }).errors[q.name]);
  }
}
for (const invalid of ['-1', '1.5', '1e2', '2147483648', 'NaN']) {
  assert(validate({ ...values, highest_night: invalid }).errors.highest_night);
}
// The launch question never reaches the anonymous answers; only a valid email leaves validate.
assert.equal(validate(values).answers.launch_notify, undefined);
assert.equal(validate(values).notifyEmail, 'vos@ejemplo.com');
assert.equal(validate({ ...values, launch_notify: 'false', launch_email: 'nope' }).notifyEmail, null);
assert.equal(Object.keys(validate({ ...values, launch_notify: 'false', launch_email: 'nope' }).errors).length, 0);
assert(validate({ ...values, launch_notify: 'maybe' }).errors.launch_notify);
for (const invalid of ['', '   ', 'vos', 'vos@ejemplo', 'vos @ejemplo.com', 'a@b.c' + 'x'.repeat(250)]) {
  assert(validate({ ...values, launch_email: invalid }).errors.launch_email, invalid);
}
for (const valid of ['0', '2', '2147483647']) assert.equal(validate({ ...values, highest_night: valid }).errors.highest_night, undefined);
for (const name of ['favorite_part', 'one_thing_to_change']) {
  for (const invalid of [' ', '\n\t', 'x'.repeat(4001)]) assert(validate({ ...values, [name]: invalid }).errors[name]);
  assert.equal(validate({ ...values, [name]: 'x'.repeat(4000) }).errors[name], undefined);
}
assert(!fs.readFileSync('index.html', 'utf8').includes('resultados.html'));
assert(!fs.readFileSync('preguntas.html', 'utf8').includes('resultados.html'));
console.log('PASS validation: exactly 16 questions, optional launch email kept out of the answers, all option mappings and rating labels, numeric boundaries, whitespace and text lengths, no public results links');
