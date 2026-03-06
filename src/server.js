import Fastify from "fastify";
import cors from "@fastify/cors";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateAllData } from "./generator.js";
import { Store } from "./store.js";
import { registerRoutes } from "./router.js";
import { generateOpenAPISpec } from "./openapi.js";
import { createRequestLogger, logStartupBanner } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Read the package version from package.json.
 * @returns {Promise<string>} Package version string
 */
async function getPackageVersion() {
  try {
    const pkgPath = join(__dirname, "..", "package.json");
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

/**
 * Create and start the mock API server.
 * @param {object} schema - Parsed and validated schema object
 * @param {object} options - Server options
 * @param {number} options.port - Port to listen on
 * @param {string} [options.host='0.0.0.0'] - Host to bind to
 * @param {string} options.schemaPath - Path to the schema file (for display)
 * @returns {Promise<import('fastify').FastifyInstance>} Running Fastify instance
 */
export async function startServer(schema, options) {
  const { port = 3000, host = "0.0.0.0", schemaPath = "schema.json" } = options;
  const config = schema.config || {};
  const version = await getPackageVersion();

  // Create Fastify instance with logging disabled (we use our own logger)
  const app = Fastify({
    logger: false,
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: [
      "X-Total-Count",
      "X-Total-Pages",
      "X-Current-Page",
      "X-Per-Page",
    ],
  });

  // Register request logger hooks
  const logger = createRequestLogger();
  app.addHook("onRequest", logger.onRequest);
  app.addHook("onResponse", logger.onResponse);

  // Generate initial data
  const initialData = generateAllData(schema);

  // Create the in-memory store
  const store = new Store(initialData, schema);

  // Register dynamic routes
  registerRoutes(app, store, schema, config);

  // Register OpenAPI spec endpoint
  const spec = generateOpenAPISpec(schema, port);
  app.get("/_spec", async () => spec);

  // Root endpoint with API info
  app.get("/", async () => ({
    name: "mockapi-local",
    version,
    resources: Object.keys(schema.resources || {}),
    endpoints: {
      spec: "/_spec",
      ...Object.fromEntries(
        Object.keys(schema.resources || {}).map((r) => [r, `/${r}`])
      ),
    },
  }));

  // Start listening
  try {
    await app.listen({ port, host });
  } catch (err) {
    if (err.code === "EADDRINUSE") {
      throw new Error(
        `Port ${port} is already in use. Try a different port with --port <number>`
      );
    }
    throw err;
  }

  // Graceful shutdown
  let isShuttingDown = false;
  const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    process.stdout.write(`\n  Received ${signal}, shutting down...\n`);
    app.close().finally(() => process.exit(0));
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  // Display startup banner
  const resourceNames = Object.keys(schema.resources || {});
  logStartupBanner(port, schemaPath, resourceNames, config, version);

  return app;
}
