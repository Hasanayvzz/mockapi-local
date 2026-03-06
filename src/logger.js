import chalk from "chalk";

/**
 * Format milliseconds to a human-readable duration string.
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get a colored status code string based on HTTP status ranges.
 * @param {number} statusCode - HTTP status code
 * @returns {string} Chalk-colored status code
 */
function colorStatus(statusCode) {
  if (statusCode >= 500) return chalk.red.bold(statusCode);
  if (statusCode >= 400) return chalk.yellow.bold(statusCode);
  if (statusCode >= 300) return chalk.cyan.bold(statusCode);
  if (statusCode >= 200) return chalk.green.bold(statusCode);
  return chalk.white(statusCode);
}

/**
 * Get a colored HTTP method string.
 * @param {string} method - HTTP method
 * @returns {string} Chalk-colored method
 */
function colorMethod(method) {
  const colors = {
    GET: chalk.bgGreen.black.bold,
    POST: chalk.bgBlue.white.bold,
    PUT: chalk.bgYellow.black.bold,
    PATCH: chalk.bgMagenta.white.bold,
    DELETE: chalk.bgRed.white.bold,
    OPTIONS: chalk.bgGray.white.bold,
    HEAD: chalk.bgCyan.black.bold,
  };
  const colorFn = colors[method] || chalk.bgWhite.black.bold;
  return colorFn(` ${method.padEnd(7)} `);
}

/**
 * Create a Fastify-compatible request logging hook.
 * Logs colorful request/response information to the terminal.
 * @returns {{ onRequest: Function, onResponse: Function }} Fastify hook functions
 */
export function createRequestLogger() {
  return {
    onRequest(request, reply, done) {
      request._startTime = process.hrtime.bigint();
      done();
    },
    onResponse(request, reply, done) {
      const endTime = process.hrtime.bigint();
      const startTime = request._startTime || endTime;
      const durationMs = Number(endTime - startTime) / 1e6;

      const timestamp = chalk.gray(new Date().toLocaleTimeString());
      const method = colorMethod(request.method);
      const url = chalk.white(request.url);
      const status = colorStatus(reply.statusCode);
      const duration = chalk.gray(formatDuration(durationMs));

      console.log(`  ${timestamp}  ${method}  ${status}  ${url}  ${duration}`);
      done();
    },
  };
}

/**
 * Log a startup banner to the terminal.
 * @param {number} port - Server port
 * @param {string} schemaPath - Path to the loaded schema file
 * @param {string[]} resources - List of resource names
 * @param {object} config - Schema configuration
 * @param {string} version - Package version
 */
export function logStartupBanner(
  port,
  schemaPath,
  resources,
  config,
  version = "1.0.0"
) {
  const divider = chalk.gray("─".repeat(56));

  console.log("");
  console.log(divider);
  console.log(
    chalk.bold.hex("#FF6B6B")("  🚀 mockapi-local") + chalk.gray(` v${version}`)
  );
  console.log(divider);
  console.log("");
  console.log(chalk.gray("  Schema:    ") + chalk.white(schemaPath));
  console.log(
    chalk.gray("  Server:    ") +
      chalk.cyan.underline(`http://localhost:${port}`)
  );
  console.log(
    chalk.gray("  Resources: ") +
      resources.map((r) => chalk.yellow(r)).join(chalk.gray(", "))
  );
  if (config.delay) {
    console.log(chalk.gray("  Delay:     ") + chalk.white(`${config.delay}ms`));
  }
  if (config.errorRate) {
    console.log(
      chalk.gray("  Error Rate:") +
        chalk.white(` ${(config.errorRate * 100).toFixed(0)}%`)
    );
  }
  console.log("");
  console.log(chalk.gray("  Endpoints:"));
  for (const resource of resources) {
    console.log(
      chalk.gray("    •") +
        chalk.green(` GET, POST `) +
        chalk.white(`/${resource}`)
    );
    console.log(
      chalk.gray("    •") +
        chalk.green(` GET, PUT, PATCH, DELETE `) +
        chalk.white(`/${resource}/:id`)
    );
  }
  console.log(
    chalk.gray("    •") +
      chalk.green(` GET `) +
      chalk.white(`/_spec`) +
      chalk.gray(" (OpenAPI 3.0)")
  );
  console.log("");
  console.log(divider);
  console.log(
    chalk.gray("  Press ") +
      chalk.white.bold("Ctrl+C") +
      chalk.gray(" to stop the server")
  );
  console.log(divider);
  console.log("");
}
