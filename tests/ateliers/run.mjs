// Lance les tests moteur de chaque atelier de sélection : npm run test:ateliers
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const dir = new URL('.', import.meta.url).pathname;
let failed = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.test.ts')).sort()) {
  const r = spawnSync('npx', ['tsx', dir + f], { encoding: 'utf8' });
  const ok = r.status === 0;
  const fails = (r.stdout.match(/^FAIL.*$/gm) || []).join('\n');
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${f}${ok ? '' : '\n' + fails + (r.stderr ? '\n' + r.stderr.slice(0, 800) : '')}`);
  if (!ok) failed.push(f);
}
console.log(failed.length ? `\n${failed.length} atelier(s) en échec` : '\nTous les ateliers passent');
process.exit(failed.length ? 1 : 0);
