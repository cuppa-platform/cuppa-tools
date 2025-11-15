import { ParsedComponent } from './component-types';

export class SwiftComponentGenerator {
  generate(component: ParsedComponent, sourceFile: string): string {
    const lines: string[] = [];

    // Header with generation warning
    lines.push(this.createHeader(component.name, sourceFile));
    lines.push('import SwiftUI');
    if (component.category === 'forms' || component.hasAsyncAction) {
      lines.push('import CuppaCore');
    }
    lines.push('');

    // Component documentation
    lines.push(`/// ${component.description}`);
    lines.push('///');
    lines.push('/// Features:');
    if (component.hasAsyncAction) {
      lines.push('/// - Async action support');
      lines.push('/// - Synchronous action support');
    }
    if (component.hasLoadingState) {
      lines.push('/// - Loading state with spinner');
      lines.push('/// - Automatic state management');
    }
    component.properties.forEach(prop => {
      if (prop.description !== prop.name) {
        lines.push(`/// - ${prop.description}`);
      }
    });
    lines.push('///');
    lines.push('/// Example:');
    lines.push('/// ```swift');
    lines.push(this.generateExampleUsage(component));
    lines.push('/// ```');

    // Struct declaration
    lines.push(`public struct ${component.name}: View {`);
    lines.push('    // MARK: - Properties');
    lines.push('');

    // Properties
    component.properties.forEach(prop => {
      const isBinding = prop.type.startsWith('Binding<');
      const bindingPrefix = isBinding ? '@Binding ' : '';
      const varLet = isBinding ? 'var' : 'let';
      lines.push(`    ${bindingPrefix}${varLet} ${prop.name}: ${prop.swiftType}`);
    });

    // Loading state if needed
    if (component.hasAsyncAction) {
      lines.push('    @State private var isPerformingAction = false');
    }

    // Actions
    component.actions.forEach(action => {
      const params = action.parameters.map(p => `${p.swiftType}`).join(', ');
      const returnType = action.returnType !== 'Void' ? ` -> ${action.returnType}` : ' -> Void';
      const asyncKeyword = action.isAsync ? ' async' : '';
      lines.push(`    let ${action.name}: (${params})${asyncKeyword}${returnType}`);
    });

    lines.push('');
    lines.push('    // MARK: - Initialization');
    lines.push('');

    // Initializers
    if (component.hasAsyncAction) {
      lines.push(this.generateAsyncInitializer(component));
      lines.push('');
      lines.push(this.generateSyncInitializer(component));
      lines.push('');
    } else {
      lines.push(this.generateInitializer(component));
      lines.push('');
    }

    // Body
    lines.push('    // MARK: - Body');
    lines.push('');
    lines.push('    public var body: some View {');
    lines.push(this.generateBody(component));
    lines.push('    }');

    // Helper methods
    if (component.hasAsyncAction) {
      lines.push('');
      lines.push('    // MARK: - Actions');
      lines.push('');
      lines.push(this.generateActionHandler(component));
    }

    lines.push('}');
    lines.push('');

    // Preview
    lines.push(this.generatePreview(component));

    return lines.join('\n');
  }

  private createHeader(componentName: string, sourceFile: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return [
      '//',
      `//  ${componentName}.swift`,
      '//  CuppaUI',
      '//',
      `//  Generated from component specifications on ${timestamp}.`,
      '//  Copyright © 2025 MyCuppa. All rights reserved.',
      '//',
      `//  ${componentName} component`,
      '//',
      '//  ⚠️ DO NOT EDIT: This file is auto-generated from component specifications.',
      `//  Source: ${sourceFile}`,
      '//  To make changes, update the component JSON files and regenerate.',
      '//',
      '',
    ].join('\n');
  }

  private generateExampleUsage(component: ParsedComponent): string {
    const requiredProps = component.properties.filter(p => p.required);
    const propsStr = requiredProps
      .map(p => {
        if (p.type === 'String') return `"${p.name}"`;
        if (p.type === 'Bool') return 'true';
        if (p.type === 'Int' || p.type === 'Double') return '0';
        return p.name;
      })
      .slice(0, 1)
      .join(', ');

    if (component.hasAsyncAction) {
      return `/// ${component.name}(${propsStr}) {\n///     // Handle action\n/// }`;
    }
    return `/// ${component.name}(${propsStr})`;
  }

  private generateInitializer(component: ParsedComponent): string {
    const lines: string[] = [];

    const params = component.properties.map(prop => {
      const isBinding = prop.type.startsWith('Binding<');
      const paramType = isBinding ? `Binding<${prop.swiftType}>` : prop.swiftType;
      const defaultVal = !prop.required && prop.defaultValue !== undefined
        ? ` = ${this.formatDefaultValue(prop.defaultValue, prop.type)}`
        : '';
      return `        ${prop.name}: ${paramType}${defaultVal}`;
    });

    component.actions.forEach(action => {
      const actionParams = action.parameters.map(p => p.swiftType).join(', ');
      const returnType = action.returnType !== 'Void' ? ` -> ${action.returnType}` : ' -> Void';
      const asyncKeyword = action.isAsync ? ' async' : '';
      params.push(`        ${action.name}: @escaping (${actionParams})${asyncKeyword}${returnType}`);
    });

    lines.push('    public init(');
    lines.push(params.join(',\n'));
    lines.push('    ) {');

    component.properties.forEach(prop => {
      const isBinding = prop.type.startsWith('Binding<');
      const prefix = isBinding ? '_' : 'self.';
      lines.push(`        ${prefix}${prop.name} = ${prop.name}`);
    });

    component.actions.forEach(action => {
      lines.push(`        self.${action.name} = ${action.name}`);
    });

    lines.push('    }');

    return lines.join('\n');
  }

  private generateAsyncInitializer(component: ParsedComponent): string {
    const lines: string[] = [];

    const params = component.properties.map(prop => {
      const isBinding = prop.type.startsWith('Binding<');
      const paramType = isBinding ? `Binding<${prop.swiftType}>` : prop.swiftType;
      const defaultVal = !prop.required && prop.defaultValue !== undefined
        ? ` = ${this.formatDefaultValue(prop.defaultValue, prop.type)}`
        : '';
      return `        ${prop.name}: ${paramType}${defaultVal}`;
    });

    params.push('        action: @escaping () async -> Void');

    lines.push('    /// Async action initializer');
    lines.push('    public init(');
    lines.push(params.join(',\n'));
    lines.push('    ) {');

    component.properties.forEach(prop => {
      const isBinding = prop.type.startsWith('Binding<');
      const prefix = isBinding ? '_' : 'self.';
      lines.push(`        ${prefix}${prop.name} = ${prop.name}`);
    });

    lines.push('        self.action = action');
    lines.push('    }');

    return lines.join('\n');
  }

  private generateSyncInitializer(component: ParsedComponent): string {
    const lines: string[] = [];

    const params = component.properties.map(prop => {
      const isBinding = prop.type.startsWith('Binding<');
      const paramType = isBinding ? `Binding<${prop.swiftType}>` : prop.swiftType;
      const defaultVal = !prop.required && prop.defaultValue !== undefined
        ? ` = ${this.formatDefaultValue(prop.defaultValue, prop.type)}`
        : '';
      return `        ${prop.name}: ${paramType}${defaultVal}`;
    });

    params.push('        action: @escaping () -> Void');

    lines.push('    /// Synchronous action initializer');
    lines.push('    public init(');
    lines.push(params.join(',\n'));
    lines.push('    ) {');

    component.properties.forEach(prop => {
      const isBinding = prop.type.startsWith('Binding<');
      const prefix = isBinding ? '_' : 'self.';
      lines.push(`        ${prefix}${prop.name} = ${prop.name}`);
    });

    lines.push('        self.action = {');
    lines.push('            Task { action() }');
    lines.push('        }');
    lines.push('    }');

    return lines.join('\n');
  }

  private generateBody(component: ParsedComponent): string {
    const lines: string[] = [];
    const indent = '        ';

    // Button wrapper if has action
    if (component.actions.length > 0) {
      const actionName = component.actions[0].name;
      lines.push(`${indent}Button {`);
      if (component.hasAsyncAction) {
        lines.push(`${indent}    handleAction()`);
      } else {
        lines.push(`${indent}    ${actionName}()`);
      }
      lines.push(`${indent}} label: {`);
    }

    // Content
    if (component.hasLoadingState) {
      lines.push(`${indent}    ZStack {`);

      // Determine what to show in content
      const iconProp = component.properties.find(p => p.name === 'icon' || p.name === 'iconName');
      const titleProp = component.properties.find(p => p.name === 'title' || p.name === 'text');

      if (iconProp) {
        lines.push(`${indent}        Image(systemName: ${iconProp.name})`);
        lines.push(`${indent}            .opacity((isLoading || isPerformingAction) ? 0 : 1)`);
      } else if (titleProp) {
        lines.push(`${indent}        Text(${titleProp.name})`);
        lines.push(`${indent}            .opacity((isLoading || isPerformingAction) ? 0 : 1)`);
      }

      lines.push('');
      lines.push(`${indent}        if isLoading || isPerformingAction {`);
      lines.push(`${indent}            ProgressView()`);
      lines.push(`${indent}                .progressViewStyle(CircularProgressViewStyle())`);
      lines.push(`${indent}        }`);
      lines.push(`${indent}    }`);
    } else {
      const iconProp = component.properties.find(p => p.name === 'icon' || p.name === 'iconName');
      const titleProp = component.properties.find(p => p.name === 'title' || p.name === 'text');
      const messageProp = component.properties.find(p => p.name === 'message');

      if (iconProp) {
        lines.push(`${indent}    Image(systemName: ${iconProp.name})`);
      } else if (messageProp) {
        lines.push(`${indent}    Text(${messageProp.name})`);
      } else if (titleProp) {
        lines.push(`${indent}    Text(${titleProp.name})`);
      }
    }

    // Styling
    lines.push(this.generateStyling(component, indent + '    '));

    // Close button label
    if (component.actions.length > 0) {
      lines.push(`${indent}}`);
      lines.push(`${indent}.buttonStyle(.plain)`);
    }

    // States
    if (component.hasLoadingState) {
      lines.push(`${indent}.disabled(isLoading || isPerformingAction)`);
      lines.push(`${indent}.opacity((isLoading || isPerformingAction) ? 0.6 : 1.0)`);
    }

    return lines.join('\n');
  }

  private generateStyling(component: ParsedComponent, indent: string): string {
    const lines: string[] = [];
    const style = component.style;

    if (style.font) {
      lines.push(`${indent}.font(.${style.font})`);
    }
    if (style.fontWeight) {
      lines.push(`${indent}.fontWeight(.${style.fontWeight})`);
    }
    if (style.foregroundColor) {
      lines.push(`${indent}.foregroundStyle(.${style.foregroundColor})`);
    }
    if (style.padding) {
      lines.push(`${indent}.padding(.vertical, ${style.padding.top})`);
      lines.push(`${indent}.padding(.horizontal, ${style.padding.leading})`);
    }
    if (style.backgroundColor) {
      lines.push(`${indent}.background(.${style.backgroundColor})`);
    }
    if (style.cornerRadius) {
      lines.push(`${indent}.clipShape(RoundedRectangle(cornerRadius: ${style.cornerRadius}))`);
    }
    if (style.borderColor && style.borderWidth) {
      lines.push(`${indent}.overlay(`);
      lines.push(`${indent}    RoundedRectangle(cornerRadius: ${style.cornerRadius || 0})`);
      lines.push(`${indent}        .strokeBorder(.${style.borderColor}, lineWidth: ${style.borderWidth})`);
      lines.push(`${indent})`);
    }
    if (style.maxWidth) {
      lines.push(`${indent}.frame(maxWidth: .${style.maxWidth})`);
    }
    if (style.minHeight) {
      lines.push(`${indent}.frame(minHeight: ${style.minHeight})`);
    }

    return lines.join('\n');
  }

  private generateActionHandler(component: ParsedComponent): string {
    const lines: string[] = [];

    lines.push('    private func handleAction() {');
    lines.push('        Task {');
    lines.push('            isPerformingAction = true');
    lines.push('            await action()');
    lines.push('            isPerformingAction = false');
    lines.push('        }');
    lines.push('    }');

    return lines.join('\n');
  }

  private generatePreview(component: ParsedComponent): string {
    const lines: string[] = [];

    lines.push(`#Preview("${component.name}") {`);

    // For form components with bindings, add @State variables
    const bindingProps = component.properties.filter(p => p.type.startsWith('Binding<'));
    if (bindingProps.length > 0) {
      const hasStringBinding = bindingProps.some(p => p.swiftType === 'String');
      const hasBoolBinding = bindingProps.some(p => p.swiftType === 'Bool');

      if (hasStringBinding) {
        lines.push('    @Previewable @State var previewText = ""');
      }
      if (hasBoolBinding) {
        lines.push('    @Previewable @State var previewBool = false');
      }
    }

    lines.push('    VStack(spacing: 20) {');

    // Build parameter list for preview
    const previewParams: string[] = [];

    component.properties.forEach(prop => {
      const isBinding = prop.type.startsWith('Binding<');

      if (isBinding) {
        if (prop.swiftType === 'Bool') {
          previewParams.push(`${prop.name}: $previewBool`);
        } else {
          previewParams.push(`${prop.name}: $previewText`);
        }
      } else if (prop.name === 'title' || prop.name === 'text') {
        previewParams.push(`${prop.name}: "${component.name}"`);
      } else if (prop.name === 'message') {
        previewParams.push(`${prop.name}: "This is a ${prop.name}"`);
      } else if (prop.name === 'type') {
        previewParams.push(`${prop.name}: "info"`);
      } else if (prop.name === 'status') {
        previewParams.push(`${prop.name}: "success"`);
      } else if (prop.name === 'icon' || prop.name === 'iconName' || prop.name === 'systemIcon') {
        previewParams.push(`${prop.name}: "star.fill"`);
      } else if (prop.name === 'description' && prop.type === 'String' && prop.required) {
        previewParams.push(`${prop.name}: "Description text"`);
      } else if (prop.name === 'label' && !prop.required) {
        previewParams.push(`${prop.name}: "Button"`);
      } else if (prop.name === 'errorMessage' || prop.name === 'subtitle' || prop.name === 'description') {
        previewParams.push(`${prop.name}: nil`);
      } else if (prop.name === 'options' && prop.swiftType.startsWith('[')) {
        previewParams.push(`${prop.name}: ["Option 1", "Option 2", "Option 3"]`);
      } else if (prop.type === 'String' && prop.required) {
        previewParams.push(`${prop.name}: "${prop.name}"`);
      } else if (prop.type === 'String?' && !prop.required) {
        // Skip optional String parameters without specific handling
      } else if (prop.type === 'Bool' && prop.required) {
        previewParams.push(`${prop.name}: false`);
      } else if (!prop.required && prop.defaultValue !== undefined) {
        // Skip optional props with defaults
      }
    });

    const paramsStr = previewParams.join(', ');

    if (component.hasAsyncAction) {
      lines.push(`        ${component.name}(${paramsStr}) {`);
      lines.push('            // Async action');
      lines.push('        }');
    } else if (component.actions.length > 0) {
      lines.push(`        ${component.name}(${paramsStr}) {`);
      lines.push('            print("Action triggered")');
      lines.push('        }');
    } else {
      lines.push(`        ${component.name}(${paramsStr})`);
    }

    lines.push('    }');
    lines.push('    .padding()');
    lines.push('}');

    return lines.join('\n');
  }

  private formatDefaultValue(value: any, type: string): string {
    if (type === 'String') return `"${value}"`;
    if (type === 'Bool') return value ? 'true' : 'false';
    if (type === 'Color') return `.${value}`;
    return String(value);
  }
}
