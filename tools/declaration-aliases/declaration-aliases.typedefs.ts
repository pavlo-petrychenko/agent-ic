export interface TsconfigFile {
  readonly compilerOptions?: {
    readonly paths?: Readonly<Record<string, readonly string[]>>;
    readonly rootDir?: string;
    readonly outDir?: string;
  };
}

export interface DeclarationAlias {
  readonly prefix: string;
  readonly outputDir: string;
}

export interface DeclarationLayout {
  readonly aliases: readonly DeclarationAlias[];
  readonly prefixes: readonly string[];
  readonly outDir: string;
}

export interface UnresolvedSpecifier {
  readonly file: string;
  readonly specifier: string;
}
