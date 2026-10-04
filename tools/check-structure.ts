import { EXIT_FAILURE } from './check-structure/check-structure.constants.ts';
import { checkStructure, formatViolation } from './check-structure/check-structure.helpers.ts';

const root = process.argv[2] ?? process.cwd();
const violations = checkStructure(root);

for (const violation of violations) {
  process.stderr.write(`${formatViolation(violation)}\n`);
}

if (violations.length > 0) {
  process.stderr.write(
    `\n${violations.length} structure violation(s). The allowed layout is in docs/rules/structure.md.\n`,
  );
  process.exit(EXIT_FAILURE);
}
