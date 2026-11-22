// Hook PostToolUse: formatea con Prettier cada archivo que el agente edita o crea.
const { execFileSync } = require('child_process');
const path = require('path');

let entrada = '';
process.stdin.on('data', (d) => (entrada += d));
process.stdin.on('end', () => {
  const archivo = JSON.parse(entrada || '{}').tool_input?.file_path;
  if (!archivo || !/\.(tsx?|jsx?|json|md|css|html)$/.test(archivo)) return;
  const raiz = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '../..');
  const prettier = require.resolve('prettier/bin/prettier.cjs', { paths: [raiz] });
  try {
    // Sin shell: las rutas con espacios llegan intactas.
    execFileSync(process.execPath, [prettier, '--write', '--ignore-unknown', archivo], { cwd: raiz, stdio: 'ignore' });
  } catch {
    process.stderr.write(`Prettier no pudo formatear ${archivo}\n`);
    process.exit(2); // el agente ve el aviso y lo corrige
  }
});
