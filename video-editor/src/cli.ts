import { CONFIG } from './config.ts';
import { analyze, loadPlan, projectDirFor, startProjectRender } from './pipeline.ts';
import { startServer } from './server.ts';
import { bold, cyan, dim, exists, fmtTime, green, logStep, red } from './util.ts';

const USAGE = `
${bold('CutRoom')} — AI video editor (silence cuts, bad-take removal, auto graphics)

usage:
  node src/cli.ts edit <video>      analyze, then open the review UI       ${dim('(recommended)')}
  node src/cli.ts analyze <video>   run the AI analysis, write the edit plan
  node src/cli.ts ui <video|dir>    open the review UI for an analyzed project
  node src/cli.ts render <video|dir>  render output.mp4 from the edit plan

flags:
  --mock         run without any API calls (synthetic transcript + canned graphics)
  --port <n>     UI port (default ${CONFIG.port})

env (.env):       SONIOX_API_KEY, OPENROUTER_API_KEY — see .env.example for options
`;

function fail(msg: string): never {
  console.error(`${red('✗')} ${msg}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const args: string[] = [];
  let port = CONFIG.port;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--mock') (CONFIG as { mock: boolean }).mock = true;
    else if (argv[i] === '--port') port = Number(argv[++i]) || CONFIG.port;
    else if (argv[i] === '-h' || argv[i] === '--help') {
      console.log(USAGE);
      return;
    } else args.push(argv[i]);
  }
  const [cmd, target] = args;
  if (!cmd) {
    console.log(USAGE);
    return;
  }
  if (!target) fail(`missing <video> argument\n${USAGE}`);

  const resolveProject = (t: string): string => {
    if (exists(`${t}/plan.json`)) return t;
    const dir = projectDirFor(t);
    if (exists(`${dir}/plan.json`)) return dir;
    fail(`no analyzed project found for ${t} — run: node src/cli.ts analyze ${t}`);
  };

  switch (cmd) {
    case 'analyze': {
      await analyze(target);
      break;
    }
    case 'edit': {
      const projDir = await analyze(target);
      await startServer(projDir, port);
      break;
    }
    case 'ui': {
      await startServer(resolveProject(target), port);
      break;
    }
    case 'render': {
      const projDir = resolveProject(target);
      const plan = loadPlan(projDir);
      const done = logStep(`render ${plan.project}`);
      let lastPct = -1;
      const { handle, outPath, outDuration } = startProjectRender(projDir, (frac) => {
        const pct = Math.floor(frac * 100);
        if (pct !== lastPct && pct % 5 === 0) {
          process.stdout.write(`\r  ${cyan('▸')} rendering ${pct}%   `);
          lastPct = pct;
        }
      });
      await handle.done;
      process.stdout.write('\r');
      done(fmtTime(outDuration));
      console.log(`${green('●')} ${bold(outPath)}`);
      break;
    }
    default:
      fail(`unknown command "${cmd}"\n${USAGE}`);
  }
}

main().catch((e: Error) => {
  console.error(`${red('✗')} ${e.message}`);
  process.exit(1);
});
