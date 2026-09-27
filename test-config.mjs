import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctaKinds = [...html.matchAll(/data-cta="(\w+)"/g)].map(m => m[1]);
const hasNoticeEl = html.includes('id="checkout-notice"');

function run(cfg) {
  // minimal DOM: one node per data-cta attribute, plus the notice element
  const nodes = ctaKinds.map(kind => {
    const attrs = { 'data-cta': kind };
    return { kind, attrs, _shown: false,
      get href() { return this.attrs.href ?? null; },
      getAttribute: k => attrs[k] ?? null,
      setAttribute: (k, v) => { attrs[k] = v; },
      classList: { add() { this._added = true; }, _added: false } };
  });
  let warned = false;
  const notice = { _show: false, classList: { add() { notice._show = true; } } };
  const ctx = {
    document: {
      getElementById: id => (id === 'checkout-notice' ? notice : null),
      querySelectorAll: () => nodes,
    },
    console: { warn: () => { warned = true; } },
  };
  vm.createContext(ctx);
  // splice config values in the way a board member would: edit the constant
  let body = script;
  for (const [k, v] of Object.entries(cfg)) {
    body = body.replace(new RegExp(`(var ${k}\\s*=\\s*)""`), `$1${JSON.stringify(v)}`);
  }
  vm.runInContext(body, ctx);
  return { nodes, notice, warned };
}

const buy = r => r.nodes.find(n => n.kind === 'buy');
const intake = r => r.nodes.find(n => n.kind === 'intake');
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

console.log('structure');
check('script block found', !!script);
check('notice element present in markup', hasNoticeEl);
const uniq = [...new Set(ctaKinds)].sort();
check('all three CTA kinds wired: ' + JSON.stringify(uniq),
  JSON.stringify(uniq) === '["buy","contact","intake"]');
check('hero + buy-section CTAs both present (' + ctaKinds.length + ' total)', ctaKinds.length === 6);

console.log('\nstate 1: nothing configured (today, pre-Stripe)');
let r = run({});
check('buy -> mailto, not a dead link', (buy(r).href || '').startsWith('mailto:'), buy(r).href);
check('buy subject is the offer', (buy(r).href || '').includes('Launch%20Pack'));
check('buy body asks for the stack', decodeURIComponent(buy(r).href || '').includes('What I run'));
check('intake -> mailto free sample', (intake(r).href || '').includes('free%20sample'));
check('honesty notice shown', r.notice._show === true);

console.log('\nstate 2: Stripe link published');
r = run({ CHECKOUT_URL: 'https://buy.stripe.com/live_test_abc123' });
check('buy -> the payment link', buy(r).href === 'https://buy.stripe.com/live_test_abc123', buy(r).href);
check('notice stays hidden', r.notice._show === false);

console.log('\nstate 3: intake URL hosted');
r = run({ INTAKE_URL: 'https://example.com/intake' });
check('intake -> hosted form', intake(r).href === 'https://example.com/intake', intake(r).href);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
