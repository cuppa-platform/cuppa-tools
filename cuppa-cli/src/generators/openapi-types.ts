// OpenAPI 3.0 Specification Types
export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, OpenAPIPath>;
  components?: OpenAPIComponents;
}

export interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenAPIServer {
  url: string;
  description?: string;
}

export interface OpenAPIPath {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  parameters?: OpenAPIParameter[];
}

export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
  security?: Record<string, string[]>[];
}

export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema: OpenAPISchema;
}

export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, OpenAPIMediaType>;
}

export interface OpenAPIResponse {
  description: string;
  content?: Record<string, OpenAPIMediaType>;
}

export interface OpenAPIMediaType {
  schema: OpenAPISchema;
}

export interface OpenAPISchema {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  $ref?: string;
  enum?: any[];
  nullable?: boolean;
  description?: string;
}

export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema>;
  securitySchemes?: Record<string, OpenAPISecurityScheme>;
}

export interface OpenAPISecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  in?: 'query' | 'header' | 'cookie';
  name?: string;
}

// Parsed API Types
export interface ParsedAPI {
  name: string;
  version: string;
  description?: string;
  baseUrl?: string;
  endpoints: ParsedEndpoint[];
  models: ParsedAPIModel[];
}

export interface ParsedEndpoint {
  operationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary?: string;
  description?: string;
  pathParams: ParsedParameter[];
  queryParams: ParsedParameter[];
  headerParams: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  responses: ParsedResponse[];
  tags?: string[];
}

export interface ParsedParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  isArray: boolean;
  format?: string;
}

export interface ParsedRequestBody {
  type: string;
  description?: string;
  required: boolean;
  contentType: string;
}

export interface ParsedResponse {
  statusCode: string;
  type?: string;
  description: string;
  contentType?: string;
}

export interface ParsedAPIModel {
  name: string;
  description?: string;
  properties: Record<string, ParsedAPIProperty>;
  required: string[];
}

export interface ParsedAPIProperty {
  type: string;
  description?: string;
  isArray: boolean;
  format?: string;
}

// OpenAPI Parser
export class OpenAPIParser {
  parse(spec: OpenAPISpec): ParsedAPI {
    const name = this.sanitizeName(spec.info.title);
    const version = spec.info.version;
    const description = spec.info.description;
    const baseUrl = spec.servers?.[0]?.url;

    // Parse endpoints
    const endpoints = this.parseEndpoints(spec.paths);

    // Parse models from components
    const models = this.parseModels(spec.components?.schemas || {});

    return {
      name,
      version,
      description,
      baseUrl,
      endpoints,
      models,
    };
  }

  private parseEndpoints(paths: Record<string, OpenAPIPath>): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = [];

    for (const [path, pathItem] of Object.entries(paths)) {
      const methods: Array<'get' | 'post' | 'put' | 'patch' | 'delete'> = [
        'get',
        'post',
        'put',
        'patch',
        'delete',
      ];

      for (const method of methods) {
        const operation = pathItem[method];
        if (operation) {
          endpoints.push(this.parseOperation(method, path, operation, pathItem.parameters || []));
        }
      }
    }

    return endpoints;
  }

  private parseOperation(
    method: string,
    path: string,
    operation: OpenAPIOperation,
    pathParams: OpenAPIParameter[]
  ): ParsedEndpoint {
    const operationId = operation.operationId || this.generateOperationId(method, path);

    const allParams = [...pathParams, ...(operation.parameters || [])];
    const pathParameters = allParams.filter(p => p.in === 'path');
    const queryParameters = allParams.filter(p => p.in === 'query');
    const headerParameters = allParams.filter(p => p.in === 'header');

    return {
      operationId,
      method: method.toUpperCase() as any,
      path,
      summary: operation.summary,
      description: operation.description,
      pathParams: pathParameters.map(p => this.parseParameter(p)),
      queryParams: queryParameters.map(p => this.parseParameter(p)),
      headerParams: headerParameters.map(p => this.parseParameter(p)),
      requestBody: operation.requestBody
        ? this.parseRequestBody(operation.requestBody)
        : undefined,
      responses: this.parseResponses(operation.responses),
      tags: operation.tags,
    };
  }

  private parseParameter(param: OpenAPIParameter): ParsedParameter {
    const isArray = param.schema.type === 'array';
    const type = isArray && param.schema.items
      ? this.resolveType(param.schema.items)
      : this.resolveType(param.schema);

    return {
      name: param.name,
      type,
      description: param.description,
      required: param.required || false,
      isArray,
      format: param.schema.format,
    };
  }

  private parseRequestBody(body: OpenAPIRequestBody): ParsedRequestBody {
    const contentType = Object.keys(body.content)[0] || 'application/json';
    const schema = body.content[contentType]?.schema;

    return {
      type: schema ? this.resolveType(schema) : 'any',
      description: body.description,
      required: body.required || false,
      contentType,
    };
  }

  private parseResponses(responses: Record<string, OpenAPIResponse>): ParsedResponse[] {
    return Object.entries(responses).map(([statusCode, response]) => {
      const contentType = response.content ? Object.keys(response.content)[0] : undefined;
      const schema = contentType ? response.content?.[contentType]?.schema : undefined;

      return {
        statusCode,
        type: schema ? this.resolveType(schema) : undefined,
        description: response.description,
        contentType,
      };
    });
  }

  private parseModels(schemas: Record<string, OpenAPISchema>): ParsedAPIModel[] {
    return Object.entries(schemas).map(([name, schema]) => ({
      name,
      description: schema.description,
      properties: this.parseProperties(schema.properties || {}),
      required: schema.required || [],
    }));
  }

  private parseProperties(
    properties: Record<string, OpenAPISchema>
  ): Record<string, ParsedAPIProperty> {
    const parsed: Record<string, ParsedAPIProperty> = {};

    for (const [name, schema] of Object.entries(properties)) {
      const isArray = schema.type === 'array';
      const type = isArray && schema.items
        ? this.resolveType(schema.items)
        : this.resolveType(schema);

      parsed[name] = {
        type,
        description: schema.description,
        isArray,
        format: schema.format,
      };
    }

    return parsed;
  }

  private resolveType(schema: OpenAPISchema): string {
    if (schema.$ref) {
      // Extract model name from $ref like "#/components/schemas/User"
      const parts = schema.$ref.split('/');
      return parts[parts.length - 1];
    }

    if (schema.type === 'array' && schema.items) {
      return this.resolveType(schema.items);
    }

    return schema.type || 'any';
  }

  private generateOperationId(method: string, path: string): string {
    // Convert /users/{id} to getUsersById
    const parts = path.split('/').filter(p => p);
    const sanitized = parts.map(p => {
      if (p.startsWith('{') && p.endsWith('}')) {
        return 'By' + this.capitalize(p.slice(1, -1));
      }
      return this.capitalize(p);
    });

    return method.toLowerCase() + sanitized.join('');
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
