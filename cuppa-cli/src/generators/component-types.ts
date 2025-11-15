// UI Component Specification Types

export interface ComponentSpec {
  component: string;
  category: string;
  description?: string;
  properties: ComponentProperty[];
  style?: ComponentStyle;
  states?: Record<string, ComponentState>;
  actions?: ComponentAction[];
  slots?: ComponentSlot[];
}

export interface ComponentProperty {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface ComponentStyle {
  backgroundColor?: string;
  foregroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  cornerRadius?: number;
  padding?: number | {
    top?: number;
    bottom?: number;
    leading?: number;
    trailing?: number;
  };
  font?: string;
  fontWeight?: string;
  minHeight?: number;
  maxWidth?: string;
}

export interface ComponentState {
  showSpinner?: boolean;
  disableInteraction?: boolean;
  opacity?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  borderColor?: string;
  scale?: number;
}

export interface ComponentAction {
  name: string;
  type: 'sync' | 'async';
  parameters: ComponentActionParameter[];
  returnType?: string;
}

export interface ComponentActionParameter {
  name: string;
  type: string;
  label?: string;
}

export interface ComponentSlot {
  name: string;
  required: boolean;
  description?: string;
}

// Parsed Component (normalized for generation)
export interface ParsedComponent {
  name: string;
  category: string;
  description: string;
  properties: ParsedProperty[];
  style: ParsedStyle;
  states: Map<string, ParsedState>;
  actions: ParsedAction[];
  slots: ParsedSlot[];
  hasAsyncAction: boolean;
  hasLoadingState: boolean;
}

export interface ParsedProperty {
  name: string;
  type: string;
  swiftType: string;
  required: boolean;
  defaultValue?: any;
  description: string;
  isBinding?: boolean;
}

export interface ParsedStyle {
  backgroundColor?: string;
  foregroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  cornerRadius?: number;
  padding: {
    top: number;
    bottom: number;
    leading: number;
    trailing: number;
  };
  font?: string;
  fontWeight?: string;
  minHeight?: number;
  maxWidth?: string;
}

export interface ParsedState {
  name: string;
  showSpinner: boolean;
  disableInteraction: boolean;
  opacity?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  borderColor?: string;
  scale?: number;
}

export interface ParsedAction {
  name: string;
  isAsync: boolean;
  parameters: ParsedActionParameter[];
  returnType: string;
}

export interface ParsedActionParameter {
  name: string;
  type: string;
  swiftType: string;
  label?: string;
}

export interface ParsedSlot {
  name: string;
  required: boolean;
  description: string;
}

// Component Spec Parser
export class ComponentSpecParser {
  parse(spec: ComponentSpec): ParsedComponent {
    const actions = this.parseActions(spec.actions || []);
    const hasAsyncAction = actions.some(a => a.isAsync);
    const hasLoadingState = spec.states?.loading !== undefined;

    return {
      name: spec.component,
      category: spec.category,
      description: spec.description || spec.component,
      properties: this.parseProperties(spec.properties),
      style: this.parseStyle(spec.style),
      states: this.parseStates(spec.states),
      actions,
      slots: this.parseSlots(spec.slots || []),
      hasAsyncAction,
      hasLoadingState,
    };
  }

  private parseProperties(properties: ComponentProperty[]): ParsedProperty[] {
    return properties.map(prop => {
      const isBinding = prop.type.startsWith('Binding<');
      return {
        name: prop.name,
        type: prop.type,
        swiftType: this.mapToSwiftType(prop.type),
        required: prop.required,
        defaultValue: prop.defaultValue,
        description: prop.description || prop.name,
        isBinding,
      } as ParsedProperty & { isBinding?: boolean };
    });
  }

  private parseStyle(style?: ComponentStyle): ParsedStyle {
    const defaultPadding = { top: 16, bottom: 16, leading: 16, trailing: 16 };

    if (!style) {
      return { padding: defaultPadding };
    }

    let padding = defaultPadding;
    if (typeof style.padding === 'number') {
      padding = {
        top: style.padding,
        bottom: style.padding,
        leading: style.padding,
        trailing: style.padding,
      };
    } else if (style.padding) {
      padding = {
        top: style.padding.top ?? 16,
        bottom: style.padding.bottom ?? 16,
        leading: style.padding.leading ?? 16,
        trailing: style.padding.trailing ?? 16,
      };
    }

    return {
      backgroundColor: style.backgroundColor,
      foregroundColor: style.foregroundColor,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
      cornerRadius: style.cornerRadius,
      padding,
      font: style.font,
      fontWeight: style.fontWeight,
      minHeight: style.minHeight,
      maxWidth: style.maxWidth,
    };
  }

  private parseStates(states?: Record<string, ComponentState>): Map<string, ParsedState> {
    const parsed = new Map<string, ParsedState>();

    if (!states) {
      return parsed;
    }

    for (const [name, state] of Object.entries(states)) {
      parsed.set(name, {
        name,
        showSpinner: state.showSpinner || false,
        disableInteraction: state.disableInteraction || false,
        opacity: state.opacity,
        backgroundColor: state.backgroundColor,
        foregroundColor: state.foregroundColor,
        borderColor: state.borderColor,
        scale: state.scale,
      });
    }

    return parsed;
  }

  private parseActions(actions: ComponentAction[]): ParsedAction[] {
    return actions.map(action => ({
      name: action.name,
      isAsync: action.type === 'async',
      parameters: action.parameters.map(param => ({
        name: param.name,
        type: param.type,
        swiftType: this.mapToSwiftType(param.type),
        label: param.label,
      })),
      returnType: action.returnType || 'Void',
    }));
  }

  private parseSlots(slots: ComponentSlot[]): ParsedSlot[] {
    return slots.map(slot => ({
      name: slot.name,
      required: slot.required,
      description: slot.description || slot.name,
    }));
  }

  private mapToSwiftType(type: string): string {
    const typeMap: Record<string, string> = {
      'String': 'String',
      'Int': 'Int',
      'Double': 'Double',
      'Bool': 'Bool',
      'Color': 'Color',
      'Font': 'Font',
      'Image': 'Image',
      'Void': 'Void',
      'Any': 'Any',
    };

    // Handle Binding types - extract inner type
    if (type.startsWith('Binding<') && type.endsWith('>')) {
      const innerType = type.slice(8, -1);
      return this.mapToSwiftType(innerType);
    }

    // Handle array types
    if (type.endsWith('[]')) {
      const baseType = type.slice(0, -2);
      return `[${this.mapToSwiftType(baseType)}]`;
    }

    // Handle optional types
    if (type.endsWith('?')) {
      const baseType = type.slice(0, -1);
      return `${this.mapToSwiftType(baseType)}?`;
    }

    return typeMap[type] || type;
  }
}
