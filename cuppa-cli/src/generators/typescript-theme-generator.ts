import { ParsedTheme } from './design-tokens-types';

export class TypeScriptThemeGenerator {
  generate(theme: ParsedTheme, sourceFile: string): string {
    const lines: string[] = [];

    // Header
    lines.push(this.createHeader(sourceFile));
    lines.push('');

    // Theme object
    lines.push(`/**`);
    lines.push(` * Design system theme generated from ${sourceFile}`);
    lines.push(` */`);
    lines.push(`export const ${theme.name.toLowerCase()} = {`);

    // Colors
    if (theme.colors.length > 0) {
      lines.push('  colors: {');
      theme.colors.forEach((color, index) => {
        const comma = index === theme.colors.length - 1 ? '' : ',';
        if (color.description) {
          lines.push(`    /** ${color.description} */`);
        }
        lines.push(`    ${color.name}: '${color.value}'${comma}`);
      });
      lines.push('  },');
      lines.push('');
    }

    // Typography
    if (this.hasTypography(theme)) {
      lines.push('  typography: {');

      // Font Families
      if (theme.typography.fontFamilies.length > 0) {
        lines.push('    fontFamilies: {');
        theme.typography.fontFamilies.forEach((font, index) => {
          const comma = index === theme.typography.fontFamilies.length - 1 ? '' : ',';
          const value = font.fallback
            ? `'${font.value}', ${font.fallback.map(f => `'${f}'`).join(', ')}`
            : `'${font.value}'`;
          lines.push(`      ${font.name}: ${value}${comma}`);
        });
        lines.push('    },');
      }

      // Font Sizes
      if (theme.typography.fontSizes.length > 0) {
        lines.push('    fontSizes: {');
        theme.typography.fontSizes.forEach((size, index) => {
          const comma = index === theme.typography.fontSizes.length - 1 ? '' : ',';
          lines.push(`      ${size.name}: '${size.value}${size.unit}'${comma}`);
        });
        lines.push('    },');
      }

      // Font Weights
      if (theme.typography.fontWeights.length > 0) {
        lines.push('    fontWeights: {');
        theme.typography.fontWeights.forEach((weight, index) => {
          const comma = index === theme.typography.fontWeights.length - 1 ? '' : ',';
          const value = typeof weight.value === 'number' ? weight.value : `'${weight.value}'`;
          lines.push(`      ${weight.name}: ${value}${comma}`);
        });
        lines.push('    },');
      }

      // Line Heights
      if (theme.typography.lineHeights.length > 0) {
        lines.push('    lineHeights: {');
        theme.typography.lineHeights.forEach((lineHeight, index) => {
          const comma = index === theme.typography.lineHeights.length - 1 ? '' : ',';
          lines.push(`      ${lineHeight.name}: '${lineHeight.value}${lineHeight.unit}'${comma}`);
        });
        lines.push('    },');
      }

      // Letter Spacing
      if (theme.typography.letterSpacing.length > 0) {
        lines.push('    letterSpacing: {');
        theme.typography.letterSpacing.forEach((spacing, index) => {
          const comma = index === theme.typography.letterSpacing.length - 1 ? '' : ',';
          lines.push(`      ${spacing.name}: '${spacing.value}${spacing.unit}'${comma}`);
        });
        lines.push('    },');
      }

      lines.push('  },');
      lines.push('');
    }

    // Spacing
    if (theme.spacing.length > 0) {
      lines.push('  spacing: {');
      theme.spacing.forEach((space, index) => {
        const comma = index === theme.spacing.length - 1 ? '' : ',';
        lines.push(`    ${space.name}: '${space.value}${space.unit}'${comma}`);
      });
      lines.push('  },');
      lines.push('');
    }

    // Border Radius
    if (theme.borderRadius.length > 0) {
      lines.push('  borderRadius: {');
      theme.borderRadius.forEach((radius, index) => {
        const comma = index === theme.borderRadius.length - 1 ? '' : ',';
        lines.push(`    ${radius.name}: '${radius.value}${radius.unit}'${comma}`);
      });
      lines.push('  },');
      lines.push('');
    }

    // Shadows
    if (theme.shadows.length > 0) {
      lines.push('  shadows: {');
      theme.shadows.forEach((shadow, index) => {
        const comma = index === theme.shadows.length - 1 ? '' : ',';
        if (shadow.description) {
          lines.push(`    /** ${shadow.description} */`);
        }
        lines.push(`    ${shadow.name}: '${shadow.value}'${comma}`);
      });
      lines.push('  },');
      lines.push('');
    }

    // Breakpoints
    if (theme.breakpoints.length > 0) {
      lines.push('  breakpoints: {');
      theme.breakpoints.forEach((breakpoint, index) => {
        const comma = index === theme.breakpoints.length - 1 ? '' : ',';
        lines.push(`    ${breakpoint.name}: '${breakpoint.value}${breakpoint.unit}'${comma}`);
      });
      lines.push('  },');
      lines.push('');
    }

    lines.push('} as const;');
    lines.push('');

    // TypeScript types
    lines.push('// TypeScript type definitions');
    lines.push(`export type ${theme.name}Theme = typeof ${theme.name.toLowerCase()};`);
    lines.push('');

    if (theme.colors.length > 0) {
      lines.push(`export type ColorToken = keyof ${theme.name}Theme['colors'];`);
    }

    if (theme.spacing.length > 0) {
      lines.push(`export type SpacingToken = keyof ${theme.name}Theme['spacing'];`);
    }

    if (theme.borderRadius.length > 0) {
      lines.push(`export type BorderRadiusToken = keyof ${theme.name}Theme['borderRadius'];`);
    }

    lines.push('');

    // CSS Variables export
    lines.push('/**');
    lines.push(' * Export theme as CSS custom properties');
    lines.push(' */');
    lines.push(`export function ${theme.name.toLowerCase()}ToCSSVariables(): Record<string, string> {`);
    lines.push('  return {');

    if (theme.colors.length > 0) {
      theme.colors.forEach(color => {
        lines.push(`    '--color-${this.toKebabCase(color.name)}': ${theme.name.toLowerCase()}.colors.${color.name},`);
      });
    }

    if (theme.spacing.length > 0) {
      theme.spacing.forEach(space => {
        lines.push(`    '--spacing-${this.toKebabCase(space.name)}': ${theme.name.toLowerCase()}.spacing.${space.name},`);
      });
    }

    if (theme.borderRadius.length > 0) {
      theme.borderRadius.forEach(radius => {
        lines.push(`    '--border-radius-${this.toKebabCase(radius.name)}': ${theme.name.toLowerCase()}.borderRadius.${radius.name},`);
      });
    }

    lines.push('  };');
    lines.push('}');
    lines.push('');

    // React hook (if colors exist)
    if (theme.colors.length > 0) {
      lines.push('/**');
      lines.push(' * React hook to inject theme CSS variables');
      lines.push(' */');
      lines.push(`export function use${theme.name}Theme() {`);
      lines.push('  if (typeof document !== \'undefined\') {');
      lines.push(`    const vars = ${theme.name.toLowerCase()}ToCSSVariables();`);
      lines.push('    Object.entries(vars).forEach(([key, value]) => {');
      lines.push('      document.documentElement.style.setProperty(key, value);');
      lines.push('    });');
      lines.push('  }');
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  private createHeader(sourceFile: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return [
      `// Generated by cuppa-cli from ${sourceFile}`,
      `// Generation date: ${timestamp}`,
      `// DO NOT EDIT MANUALLY - Changes will be overwritten`,
      '',
    ].join('\n');
  }

  private hasTypography(theme: ParsedTheme): boolean {
    return (
      theme.typography.fontFamilies.length > 0 ||
      theme.typography.fontSizes.length > 0 ||
      theme.typography.fontWeights.length > 0 ||
      theme.typography.lineHeights.length > 0 ||
      theme.typography.letterSpacing.length > 0
    );
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
      .toLowerCase();
  }
}
