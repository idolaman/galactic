export interface VisualQaSourceFile {
  content: string;
  path: string;
}

export interface VisualQaForbiddenPattern {
  description: string;
  id: string;
  pattern: RegExp;
}

export interface VisualQaViolation {
  description: string;
  id: string;
  path: string;
}

export const VISUAL_QA_FORBIDDEN_PATTERNS: VisualQaForbiddenPattern[] = [
  {
    description: "Glow utility on product surfaces",
    id: "glow-shadow",
    pattern: /shadow-glow/,
  },
  {
    description: "Large promotional shadow treatment",
    id: "large-shadow",
    pattern: /shadow-2xl/,
  },
  {
    description: "Decorative radial gradient background",
    id: "radial-gradient",
    pattern: /radial-gradient/,
  },
  {
    description: "Decorative noise or grain texture",
    id: "noise-texture",
    pattern: /grainy-gradients|noise\.svg/,
  },
  {
    description: "Decorative star or space background",
    id: "space-background",
    pattern: /starfield|star-field/,
  },
  {
    description: "Large gradient utility in operational UI",
    id: "tailwind-gradient",
    pattern: /bg-gradient-to-|from-(violet|purple|indigo)-\d|to-(violet|purple|blue|indigo)-\d/,
  },
  {
    description: "Raw CSS gradient in operational UI",
    id: "css-gradient",
    pattern: /linear-gradient/,
  },
];

export const findVisualQaSourceViolations = (
  files: VisualQaSourceFile[],
  patterns = VISUAL_QA_FORBIDDEN_PATTERNS,
): VisualQaViolation[] =>
  files.flatMap((file) =>
    patterns.flatMap((forbiddenPattern) =>
      forbiddenPattern.pattern.test(file.content)
        ? [{
            description: forbiddenPattern.description,
            id: forbiddenPattern.id,
            path: file.path,
          }]
        : [],
    ),
  );
