export interface JSONSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  items?: JSONSchemaProperty;
  enum?: any[];
  format?: string;
  default?: any;
}

export interface JSONSchemaProperty {
  type: string | string[];
  description?: string;
  format?: string;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  enum?: any[];
  default?: any;
  $ref?: string;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface ParsedModel {
  name: string;
  description?: string;
  properties: ParsedProperty[];
}

export interface ParsedProperty {
  name: string;
  type: string;
  description?: string;
  optional: boolean;
  isArray: boolean;
  format?: string;
  defaultValue?: any;
}

export class JSONSchemaParser {
  parse(schema: JSONSchema): ParsedModel {
    if (schema.type !== 'object') {
      throw new Error('Only object schemas are supported for model generation');
    }

    const name = schema.title || 'UnnamedModel';
    const description = schema.description;
    const properties = this.parseProperties(schema.properties || {}, schema.required || []);

    return {
      name,
      description,
      properties,
    };
  }

  private parseProperties(
    properties: Record<string, JSONSchemaProperty>,
    required: string[]
  ): ParsedProperty[] {
    return Object.entries(properties).map(([name, prop]) => {
      return this.parseProperty(name, prop, required.includes(name));
    });
  }

  private parseProperty(
    name: string,
    prop: JSONSchemaProperty,
    isRequired: boolean
  ): ParsedProperty {
    const type = this.resolveType(prop);
    const isArray = type === 'array';
    const actualType = isArray && prop.items ? this.resolveType(prop.items) : type;

    return {
      name,
      type: actualType,
      description: prop.description,
      optional: !isRequired || prop.nullable === true,
      isArray,
      format: prop.format,
      defaultValue: prop.default,
    };
  }

  private resolveType(prop: JSONSchemaProperty): string {
    if (Array.isArray(prop.type)) {
      // Handle union types - for now just take the first non-null type
      const nonNullType = prop.type.find(t => t !== 'null');
      return nonNullType || 'any';
    }

    return prop.type;
  }
}
