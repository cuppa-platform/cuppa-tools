import { ParsedTheme } from './design-tokens-types';

export class KotlinThemeGenerator {
  generate(theme: ParsedTheme, sourceFile: string): string {
    const lines: string[] = [];

    // Header
    lines.push(this.createHeader(sourceFile));
    lines.push('import androidx.compose.ui.graphics.Color');
    lines.push('import androidx.compose.ui.unit.dp');
    lines.push('import androidx.compose.ui.unit.sp');
    lines.push('import androidx.compose.material3.Typography');
    lines.push('import androidx.compose.ui.text.TextStyle');
    lines.push('import androidx.compose.ui.text.font.FontWeight');
    lines.push('');

    // Theme object
    lines.push(`/**`);
    lines.push(` * Design system theme generated from ${sourceFile}`);
    lines.push(` */`);
    lines.push(`object ${theme.name} {`);
    lines.push('');

    // Colors
    if (theme.colors.length > 0) {
      lines.push('    // Colors');
      lines.push('    object Colors {');
      theme.colors.forEach(color => {
        if (color.description) {
          lines.push(`        /** ${color.description} */`);
        }
        const kotlinColor = this.convertToKotlinColor(color.value);
        lines.push(`        val ${this.capitalize(color.name)} = ${kotlinColor}`);
      });
      lines.push('    }');
      lines.push('');
    }

    // Typography
    if (this.hasTypography(theme)) {
      lines.push('    // Typography');

      // Font Families
      if (theme.typography.fontFamilies.length > 0) {
        lines.push('    object FontFamilies {');
        theme.typography.fontFamilies.forEach(font => {
          lines.push(`        const val ${this.capitalize(font.name)} = "${font.value}"`);
        });
        lines.push('    }');
        lines.push('');
      }

      // Font Sizes
      if (theme.typography.fontSizes.length > 0) {
        lines.push('    object FontSizes {');
        theme.typography.fontSizes.forEach(size => {
          lines.push(`        val ${this.capitalize(size.name)} = ${size.value}.sp`);
        });
        lines.push('    }');
        lines.push('');
      }

      // Font Weights
      if (theme.typography.fontWeights.length > 0) {
        lines.push('    object FontWeights {');
        theme.typography.fontWeights.forEach(weight => {
          const kotlinWeight = this.convertToKotlinFontWeight(weight.value);
          lines.push(`        val ${this.capitalize(weight.name)} = ${kotlinWeight}`);
        });
        lines.push('    }');
        lines.push('');
      }
    }

    // Spacing
    if (theme.spacing.length > 0) {
      lines.push('    // Spacing');
      lines.push('    object Spacing {');
      theme.spacing.forEach(space => {
        lines.push(`        val ${this.capitalize(space.name)} = ${space.value}.dp`);
      });
      lines.push('    }');
      lines.push('');
    }

    // Border Radius
    if (theme.borderRadius.length > 0) {
      lines.push('    // Border Radius');
      lines.push('    object BorderRadius {');
      theme.borderRadius.forEach(radius => {
        lines.push(`        val ${this.capitalize(radius.name)} = ${radius.value}.dp`);
      });
      lines.push('    }');
      lines.push('');
    }

    // Shadows
    if (theme.shadows.length > 0) {
      lines.push('    // Shadows');
      lines.push('    object Shadows {');
      theme.shadows.forEach(shadow => {
        if (shadow.description) {
          lines.push(`        /** ${shadow.description} */`);
        }
        lines.push(`        const val ${this.capitalize(shadow.name)} = "${shadow.value}"`);
      });
      lines.push('    }');
      lines.push('');
    }

    lines.push('}');
    lines.push('');

    // Generate Compose Typography if font sizes exist
    if (theme.typography.fontSizes.length > 0) {
      lines.push('/**');
      lines.push(' * Material 3 Typography configuration');
      lines.push(' */');
      lines.push(`val ${theme.name}Typography = Typography(`);

      const typographyMap: Record<string, string> = {
        displayLarge: 'displayLarge',
        displayMedium: 'displayMedium',
        displaySmall: 'displaySmall',
        headlineLarge: 'headlineLarge',
        headlineMedium: 'headlineMedium',
        headlineSmall: 'headlineSmall',
        titleLarge: 'titleLarge',
        titleMedium: 'titleMedium',
        titleSmall: 'titleSmall',
        bodyLarge: 'bodyLarge',
        bodyMedium: 'bodyMedium',
        bodySmall: 'bodySmall',
        labelLarge: 'labelLarge',
        labelMedium: 'labelMedium',
        labelSmall: 'labelSmall',
      };

      const entries: string[] = [];
      for (const [key, value] of Object.entries(typographyMap)) {
        const matchingSize = theme.typography.fontSizes.find(
          s => s.name.toLowerCase() === key.toLowerCase()
        );
        if (matchingSize) {
          entries.push(`    ${value} = TextStyle(fontSize = ${theme.name}.FontSizes.${this.capitalize(matchingSize.name)})`);
        }
      }

      if (entries.length > 0) {
        lines.push(entries.join(',\n'));
      }

      lines.push(')');
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
      theme.typography.fontWeights.length > 0
    );
  }

  private convertToKotlinColor(hexColor: string): string {
    // Remove # if present
    let hex = hexColor.replace('#', '');

    // Convert to ARGB format for Jetpack Compose
    if (hex.length === 6) {
      hex = 'FF' + hex; // Add full opacity
    }

    return `Color(0x${hex.toUpperCase()})`;
  }

  private convertToKotlinFontWeight(weight: string | number): string {
    if (typeof weight === 'number') {
      return `FontWeight(${weight})`;
    }

    // Map string weights
    const weightMap: Record<string, string> = {
      thin: 'FontWeight.Thin',
      extralight: 'FontWeight.ExtraLight',
      light: 'FontWeight.Light',
      normal: 'FontWeight.Normal',
      regular: 'FontWeight.Normal',
      medium: 'FontWeight.Medium',
      semibold: 'FontWeight.SemiBold',
      bold: 'FontWeight.Bold',
      extrabold: 'FontWeight.ExtraBold',
      black: 'FontWeight.Black',
    };

    return weightMap[weight.toLowerCase()] || 'FontWeight.Normal';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
