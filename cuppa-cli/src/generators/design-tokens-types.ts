// Design Tokens Specification
export interface DesignTokens {
  colors?: ColorTokens;
  typography?: TypographyTokens;
  spacing?: SpacingTokens;
  borderRadius?: BorderRadiusTokens;
  shadows?: ShadowTokens;
  breakpoints?: BreakpointTokens;
}

export interface ColorTokens {
  [key: string]: string | ColorToken;
}

export interface ColorToken {
  value: string;
  description?: string;
  type?: 'solid' | 'gradient';
}

export interface TypographyTokens {
  fontFamilies?: {
    [key: string]: string | FontFamily;
  };
  fontSizes?: {
    [key: string]: string | number;
  };
  fontWeights?: {
    [key: string]: string | number;
  };
  lineHeights?: {
    [key: string]: string | number;
  };
  letterSpacing?: {
    [key: string]: string | number;
  };
}

export interface FontFamily {
  value: string;
  fallback?: string[];
}

export interface SpacingTokens {
  [key: string]: string | number | SpacingToken;
}

export interface SpacingToken {
  value: string | number;
  description?: string;
}

export interface BorderRadiusTokens {
  [key: string]: string | number;
}

export interface ShadowTokens {
  [key: string]: string | ShadowToken;
}

export interface ShadowToken {
  value: string;
  description?: string;
}

export interface BreakpointTokens {
  [key: string]: string | number;
}

// Parsed Theme Types
export interface ParsedTheme {
  name: string;
  colors: ParsedColorGroup[];
  typography: ParsedTypography;
  spacing: ParsedSpacing[];
  borderRadius: ParsedBorderRadius[];
  shadows: ParsedShadow[];
  breakpoints: ParsedBreakpoint[];
}

export interface ParsedColorGroup {
  name: string;
  value: string;
  description?: string;
}

export interface ParsedTypography {
  fontFamilies: ParsedFontFamily[];
  fontSizes: ParsedFontSize[];
  fontWeights: ParsedFontWeight[];
  lineHeights: ParsedLineHeight[];
  letterSpacing: ParsedLetterSpacing[];
}

export interface ParsedFontFamily {
  name: string;
  value: string;
  fallback?: string[];
}

export interface ParsedFontSize {
  name: string;
  value: number;
  unit: string;
}

export interface ParsedFontWeight {
  name: string;
  value: number | string;
}

export interface ParsedLineHeight {
  name: string;
  value: number;
  unit: string;
}

export interface ParsedLetterSpacing {
  name: string;
  value: number;
  unit: string;
}

export interface ParsedSpacing {
  name: string;
  value: number;
  unit: string;
}

export interface ParsedBorderRadius {
  name: string;
  value: number;
  unit: string;
}

export interface ParsedShadow {
  name: string;
  value: string;
  description?: string;
}

export interface ParsedBreakpoint {
  name: string;
  value: number;
  unit: string;
}

// Design Tokens Parser
export class DesignTokensParser {
  parse(tokens: DesignTokens, name: string = 'Theme'): ParsedTheme {
    return {
      name,
      colors: this.parseColors(tokens.colors || {}),
      typography: this.parseTypography(tokens.typography || {}),
      spacing: this.parseSpacing(tokens.spacing || {}),
      borderRadius: this.parseBorderRadius(tokens.borderRadius || {}),
      shadows: this.parseShadows(tokens.shadows || {}),
      breakpoints: this.parseBreakpoints(tokens.breakpoints || {}),
    };
  }

  private parseColors(colors: ColorTokens): ParsedColorGroup[] {
    const parsed: ParsedColorGroup[] = [];

    for (const [name, value] of Object.entries(colors)) {
      if (typeof value === 'string') {
        parsed.push({
          name: this.toCamelCase(name),
          value,
        });
      } else {
        parsed.push({
          name: this.toCamelCase(name),
          value: value.value,
          description: value.description,
        });
      }
    }

    return parsed;
  }

  private parseTypography(typography: TypographyTokens): ParsedTypography {
    return {
      fontFamilies: this.parseFontFamilies(typography.fontFamilies || {}),
      fontSizes: this.parseFontSizes(typography.fontSizes || {}),
      fontWeights: this.parseFontWeights(typography.fontWeights || {}),
      lineHeights: this.parseLineHeights(typography.lineHeights || {}),
      letterSpacing: this.parseLetterSpacing(typography.letterSpacing || {}),
    };
  }

  private parseFontFamilies(fontFamilies: { [key: string]: string | FontFamily }): ParsedFontFamily[] {
    const parsed: ParsedFontFamily[] = [];

    for (const [name, value] of Object.entries(fontFamilies)) {
      if (typeof value === 'string') {
        parsed.push({
          name: this.toCamelCase(name),
          value,
        });
      } else {
        parsed.push({
          name: this.toCamelCase(name),
          value: value.value,
          fallback: value.fallback,
        });
      }
    }

    return parsed;
  }

  private parseFontSizes(fontSizes: { [key: string]: string | number }): ParsedFontSize[] {
    return Object.entries(fontSizes).map(([name, value]) => {
      const { numValue, unit } = this.parseValue(value);
      return {
        name: this.toCamelCase(name),
        value: numValue,
        unit,
      };
    });
  }

  private parseFontWeights(fontWeights: { [key: string]: string | number }): ParsedFontWeight[] {
    return Object.entries(fontWeights).map(([name, value]) => ({
      name: this.toCamelCase(name),
      value,
    }));
  }

  private parseLineHeights(lineHeights: { [key: string]: string | number }): ParsedLineHeight[] {
    return Object.entries(lineHeights).map(([name, value]) => {
      const { numValue, unit } = this.parseValue(value);
      return {
        name: this.toCamelCase(name),
        value: numValue,
        unit,
      };
    });
  }

  private parseLetterSpacing(letterSpacing: { [key: string]: string | number }): ParsedLetterSpacing[] {
    return Object.entries(letterSpacing).map(([name, value]) => {
      const { numValue, unit } = this.parseValue(value);
      return {
        name: this.toCamelCase(name),
        value: numValue,
        unit,
      };
    });
  }

  private parseSpacing(spacing: SpacingTokens): ParsedSpacing[] {
    const parsed: ParsedSpacing[] = [];

    for (const [name, value] of Object.entries(spacing)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const { numValue, unit } = this.parseValue(value);
        parsed.push({
          name: this.toCamelCase(name),
          value: numValue,
          unit,
        });
      } else {
        const { numValue, unit } = this.parseValue(value.value);
        parsed.push({
          name: this.toCamelCase(name),
          value: numValue,
          unit,
        });
      }
    }

    return parsed;
  }

  private parseBorderRadius(borderRadius: BorderRadiusTokens): ParsedBorderRadius[] {
    return Object.entries(borderRadius).map(([name, value]) => {
      const { numValue, unit } = this.parseValue(value);
      return {
        name: this.toCamelCase(name),
        value: numValue,
        unit,
      };
    });
  }

  private parseShadows(shadows: ShadowTokens): ParsedShadow[] {
    const parsed: ParsedShadow[] = [];

    for (const [name, value] of Object.entries(shadows)) {
      if (typeof value === 'string') {
        parsed.push({
          name: this.toCamelCase(name),
          value,
        });
      } else {
        parsed.push({
          name: this.toCamelCase(name),
          value: value.value,
          description: value.description,
        });
      }
    }

    return parsed;
  }

  private parseBreakpoints(breakpoints: BreakpointTokens): ParsedBreakpoint[] {
    return Object.entries(breakpoints).map(([name, value]) => {
      const { numValue, unit } = this.parseValue(value);
      return {
        name: this.toCamelCase(name),
        value: numValue,
        unit,
      };
    });
  }

  private parseValue(value: string | number): { numValue: number; unit: string } {
    if (typeof value === 'number') {
      return { numValue: value, unit: 'px' };
    }

    // Extract number and unit from strings like "16px", "1.5rem", "2"
    const match = value.match(/^([\d.]+)([a-z%]*)$/i);
    if (match) {
      return {
        numValue: parseFloat(match[1]),
        unit: match[2] || 'px',
      };
    }

    // If no match, return as-is with px default
    return { numValue: parseFloat(value) || 0, unit: 'px' };
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toLowerCase());
  }
}
