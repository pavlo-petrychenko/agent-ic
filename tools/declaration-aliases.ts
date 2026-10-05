import { EXIT_FAILURE } from './declaration-aliases/declaration-aliases.constants.ts';
import { rewriteDeclarations } from './declaration-aliases/declaration-aliases.helpers.ts';

const unresolved = rewriteDeclarations(process.argv[2] ?? process.cwd());

for (const { file, specifier } of unresolved) {
  process.stderr.write(`${file}  ${specifier}\n`);
}

if (unresolved.length > 0) {
  process.stderr.write(
    `\n${unresolved.length} path alias(es) left in the declarations: the alias must point inside rootDir.\n`,
  );
  process.exit(EXIT_FAILURE);
}
