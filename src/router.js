import { StoreError } from "./store.js";

/**
 * Reserved query parameters that should not be treated as filters.
 * @type {Set<string>}
 */
const RESERVED_PARAMS = new Set(["page", "limit", "sort", "order"]);

/**
 * Register all CRUD routes for all resources defined in the schema.
 * @param {import('fastify').FastifyInstance} app - Fastify instance
 * @param {import('./store.js').Store} store - Data store instance
 * @param {object} schema - Schema definition
 * @param {object} config - Schema config (delay, errorRate)
 */
export function registerRoutes(app, store, schema, config) {
  const { delay = 0, errorRate = 0 } = config;

  // Middleware-like hooks for delay and error simulation
  app.addHook("preHandler", async (request, reply) => {
    // Simulate network latency
    if (delay > 0) {
      await sleep(delay);
    }

    // Simulate random server errors
    if (errorRate > 0 && Math.random() < errorRate) {
      reply.code(500).send({
        error: "Internal Server Error",
        message: "Simulated server error (configured errorRate)",
        statusCode: 500,
      });
    }
  });

  const resources = schema.resources || {};

  for (const [resourceName, resourceDef] of Object.entries(resources)) {
    registerResourceRoutes(app, store, resourceName, resourceDef, schema);
  }
}

/**
 * Register CRUD routes for a single resource.
 * @param {import('fastify').FastifyInstance} app
 * @param {import('./store.js').Store} store
 * @param {string} name - Resource name
 * @param {object} resourceDef - Resource definition from schema
 * @param {object} schema - Full schema
 */
function registerResourceRoutes(app, store, name, resourceDef, schema) {
  const basePath = `/${name}`;
  const itemPath = `/${name}/:id`;

  // GET /resource — List with pagination, filtering, sorting
  app.get(basePath, async (request, reply) => {
    try {
      const { page, limit, sort, order, ...rest } = request.query;

      const filters = {};
      for (const [key, value] of Object.entries(rest)) {
        if (!RESERVED_PARAMS.has(key)) {
          filters[key] = value;
        }
      }

      const result = store.list(name, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        sort,
        order: order || "asc",
        filters,
      });

      reply.header("X-Total-Count", result.total);
      reply.header("X-Total-Pages", result.totalPages);
      reply.header("X-Current-Page", result.page);
      reply.header("X-Per-Page", result.limit);

      return result;
    } catch (err) {
      return handleError(reply, err);
    }
  });

  // GET /resource/:id — Single item
  app.get(itemPath, async (request, reply) => {
    try {
      return store.getById(name, request.params.id);
    } catch (err) {
      return handleError(reply, err);
    }
  });

  // POST /resource — Create
  app.post(basePath, async (request, reply) => {
    try {
      const body = request.body;
      if (!body || typeof body !== "object") {
        reply.code(400).send({
          error: "Bad Request",
          message: "Request body must be a JSON object",
          statusCode: 400,
        });
        return;
      }

      const record = store.create(name, body);
      reply.code(201).send(record);
    } catch (err) {
      return handleError(reply, err);
    }
  });

  // PUT /resource/:id — Full update
  app.put(itemPath, async (request, reply) => {
    try {
      const body = request.body;
      if (!body || typeof body !== "object") {
        reply.code(400).send({
          error: "Bad Request",
          message: "Request body must be a JSON object",
          statusCode: 400,
        });
        return;
      }

      return store.update(name, request.params.id, body);
    } catch (err) {
      return handleError(reply, err);
    }
  });

  // PATCH /resource/:id — Partial update
  app.patch(itemPath, async (request, reply) => {
    try {
      const body = request.body;
      if (!body || typeof body !== "object") {
        reply.code(400).send({
          error: "Bad Request",
          message: "Request body must be a JSON object",
          statusCode: 400,
        });
        return;
      }

      return store.patch(name, request.params.id, body);
    } catch (err) {
      return handleError(reply, err);
    }
  });

  // DELETE /resource/:id — Delete
  app.delete(itemPath, async (request, reply) => {
    try {
      const deleted = store.delete(name, request.params.id);
      return { message: "Deleted successfully", data: deleted };
    } catch (err) {
      return handleError(reply, err);
    }
  });

  // Register relation routes
  const relations = resourceDef.relations || {};
  for (const [relationName, targetResource] of Object.entries(relations)) {
    const relationPath = `/${name}/:id/${relationName}`;

    app.get(relationPath, async (request, reply) => {
      try {
        const { page, limit, sort, order } = request.query;

        const result = store.getRelated(
          name,
          request.params.id,
          targetResource,
          {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            sort,
            order: order || "asc",
          }
        );

        reply.header("X-Total-Count", result.total);
        reply.header("X-Total-Pages", result.totalPages);
        reply.header("X-Current-Page", result.page);
        reply.header("X-Per-Page", result.limit);

        return result;
      } catch (err) {
        return handleError(reply, err);
      }
    });
  }
}

/**
 * Handle errors consistently, mapping StoreError to proper HTTP responses.
 * @param {import('fastify').FastifyReply} reply
 * @param {Error} err
 */
function handleError(reply, err) {
  if (err instanceof StoreError) {
    reply.code(err.statusCode).send({
      error: err.statusCode === 404 ? "Not Found" : "Server Error",
      message: err.message,
      statusCode: err.statusCode,
    });
  } else {
    reply.code(500).send({
      error: "Internal Server Error",
      message: err.message,
      statusCode: 500,
    });
  }
}

/**
 * Sleep for a specified number of milliseconds.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
