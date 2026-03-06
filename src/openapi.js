/**
 * Generate an OpenAPI 3.0 specification from the schema definition.
 * @param {object} schema - Schema definition with resources and config
 * @param {number} port - Server port for the server URL
 * @returns {object} OpenAPI 3.0 JSON specification
 */
export function generateOpenAPISpec(schema, port) {
  const resources = schema.resources || {};
  const paths = {};
  const schemas = {};

  for (const [resourceName, resourceDef] of Object.entries(resources)) {
    const fields = resourceDef.fields || {};
    const singularName =
      resourceName.endsWith("s") && resourceName.length > 1
        ? resourceName.slice(0, -1)
        : resourceName;

    const capitalName =
      singularName.charAt(0).toUpperCase() + singularName.slice(1);

    // Build schema properties for this resource
    const properties = {};
    const requiredFields = [];

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      properties[fieldName] = fieldDefToJsonSchema(fieldDef);
      if (fieldName === "id") continue; // id is auto-generated
      requiredFields.push(fieldName);
    }

    schemas[capitalName] = {
      type: "object",
      properties,
      required: requiredFields,
    };

    // Create input schema (without id)
    const inputProperties = { ...properties };
    delete inputProperties.id;
    schemas[`${capitalName}Input`] = {
      type: "object",
      properties: inputProperties,
    };

    // List endpoint
    const basePath = `/${resourceName}`;
    paths[basePath] = {
      get: {
        tags: [resourceName],
        summary: `List all ${resourceName}`,
        description: `Retrieve a paginated list of ${resourceName} with optional filtering and sorting.`,
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
            description: "Items per page",
          },
          {
            name: "sort",
            in: "query",
            schema: { type: "string" },
            description: "Field to sort by",
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
            description: "Sort order",
          },
          ...generateFilterParams(fields),
        ],
        responses: {
          200: {
            description: `List of ${resourceName}`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: `#/components/schemas/${capitalName}` },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalPages: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: [resourceName],
        summary: `Create a new ${singularName}`,
        description: `Create a new ${singularName} record.`,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${capitalName}Input` },
            },
          },
        },
        responses: {
          201: {
            description: `Created ${singularName}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${capitalName}` },
              },
            },
          },
          400: { description: "Bad request" },
        },
      },
    };

    // Item endpoints
    const itemPath = `/${resourceName}/{id}`;
    paths[itemPath] = {
      get: {
        tags: [resourceName],
        summary: `Get a ${singularName} by ID`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: `${capitalName} ID`,
          },
        ],
        responses: {
          200: {
            description: `Single ${singularName}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${capitalName}` },
              },
            },
          },
          404: { description: "Not found" },
        },
      },
      put: {
        tags: [resourceName],
        summary: `Update a ${singularName}`,
        description: `Full update (replace) a ${singularName} by ID.`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${capitalName}Input` },
            },
          },
        },
        responses: {
          200: {
            description: `Updated ${singularName}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${capitalName}` },
              },
            },
          },
          404: { description: "Not found" },
        },
      },
      patch: {
        tags: [resourceName],
        summary: `Partially update a ${singularName}`,
        description: `Partial update (merge) a ${singularName} by ID.`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${capitalName}Input` },
            },
          },
        },
        responses: {
          200: {
            description: `Patched ${singularName}`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${capitalName}` },
              },
            },
          },
          404: { description: "Not found" },
        },
      },
      delete: {
        tags: [resourceName],
        summary: `Delete a ${singularName}`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: `Deleted ${singularName}`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: { $ref: `#/components/schemas/${capitalName}` },
                  },
                },
              },
            },
          },
          404: { description: "Not found" },
        },
      },
    };

    // Relation endpoints
    const relations = resourceDef.relations || {};
    for (const [relationName, targetResource] of Object.entries(relations)) {
      const relationPath = `/${resourceName}/{id}/${relationName}`;
      const targetCapital =
        targetResource.charAt(0).toUpperCase() + targetResource.slice(1);
      const targetSingular = targetResource.endsWith("s")
        ? targetResource.slice(0, -1)
        : targetResource;

      paths[relationPath] = {
        get: {
          tags: [resourceName],
          summary: `Get ${relationName} for a ${singularName}`,
          description: `Retrieve ${relationName} associated with a specific ${singularName}.`,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: `${capitalName} ID`,
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 10 },
            },
          ],
          responses: {
            200: {
              description: `List of ${relationName}`,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          $ref: `#/components/schemas/${
                            targetSingular.charAt(0).toUpperCase() +
                            targetSingular.slice(1)
                          }`,
                        },
                      },
                      total: { type: "integer" },
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      totalPages: { type: "integer" },
                    },
                  },
                },
              },
            },
            404: { description: "Parent not found" },
          },
        },
      };
    }
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Mock API",
      description:
        "Auto-generated REST API from mockapi-local schema definition.",
      version: "1.0.0",
      contact: {
        name: "mockapi-local",
        url: "https://github.com/mockapi-local",
      },
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Local development server",
      },
    ],
    paths,
    components: {
      schemas,
    },
  };
}

/**
 * Convert a schema field definition to a JSON Schema property.
 * @param {string|object} fieldDef - Field definition
 * @returns {object} JSON Schema property
 */
function fieldDefToJsonSchema(fieldDef) {
  if (typeof fieldDef === "string") {
    return stringTypeToJsonSchema(fieldDef);
  }

  if (typeof fieldDef === "object" && fieldDef !== null) {
    switch (fieldDef.type) {
      case "number":
        return {
          type: "integer",
          minimum: fieldDef.min,
          maximum: fieldDef.max,
        };
      case "float":
        return {
          type: "number",
          minimum: fieldDef.min,
          maximum: fieldDef.max,
        };
      case "enum":
        return { type: "string", enum: fieldDef.values };
      case "ref":
        return {
          type: "string",
          description: `Reference to ${fieldDef.resource}`,
        };
      case "array":
        return {
          type: "array",
          items:
            typeof fieldDef.item === "string"
              ? stringTypeToJsonSchema(fieldDef.item)
              : fieldDefToJsonSchema(fieldDef.item),
        };
      case "boolean":
        return { type: "boolean" };
      default:
        return stringTypeToJsonSchema(fieldDef.type || "string");
    }
  }

  return { type: "string" };
}

/**
 * Map string shorthand types to JSON Schema types.
 * @param {string} type
 * @returns {object}
 */
function stringTypeToJsonSchema(type) {
  const mapping = {
    uuid: { type: "string", format: "uuid" },
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    url: { type: "string", format: "uri" },
    date: { type: "string", format: "date-time" },
    pastDate: { type: "string", format: "date-time" },
    futureDate: { type: "string", format: "date-time" },
    number: { type: "integer" },
    float: { type: "number" },
    boolean: { type: "boolean" },
    image: { type: "string", format: "uri" },
    avatar: { type: "string", format: "uri" },
    ip: { type: "string", format: "ipv4" },
    latitude: { type: "number" },
    longitude: { type: "number" },
    price: { type: "string" },
  };

  return mapping[type] || { type: "string" };
}

/**
 * Generate filter query parameters for a resource's fields.
 * @param {object} fields
 * @returns {object[]} OpenAPI parameter objects
 */
function generateFilterParams(fields) {
  const params = [];
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    if (fieldName === "id") continue;

    const schema = fieldDefToJsonSchema(fieldDef);
    if (
      schema.type === "string" ||
      schema.type === "integer" ||
      schema.type === "number"
    ) {
      params.push({
        name: fieldName,
        in: "query",
        schema: { type: "string" },
        description: `Filter by ${fieldName}`,
        required: false,
      });
    }
  }
  return params;
}
