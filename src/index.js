#!/usr/bin/env node

import { Command } from "commander";
import { readFile, writeFile, access } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { z } from "zod";
import { startServer } from "./server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Read the package version from package.json.
 * @returns {Promise<string>} Version string
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

// Zod schema for validating the schema.json structure
const fieldDefSchema = z.union([
  z.string(),
  z.object({
    type: z.string(),
    min: z.number().optional(),
    max: z.number().optional(),
    precision: z.number().optional(),
    values: z.array(z.any()).optional(),
    resource: z.string().optional(),
    item: z.any().optional(),
    length: z.number().optional(),
    fields: z.record(z.any()).optional(),
  }),
]);

const resourceSchema = z.object({
  count: z.number().int().positive().optional().default(10),
  fields: z.record(fieldDefSchema),
  relations: z.record(z.string()).optional(),
});

const configSchema = z
  .object({
    delay: z.number().min(0).optional().default(0),
    errorRate: z.number().min(0).max(1).optional().default(0),
  })
  .optional()
  .default({});

const schemaFileSchema = z.object({
  resources: z
    .record(resourceSchema)
    .refine((val) => Object.keys(val).length > 0, {
      message: "At least one resource must be defined",
    }),
  config: configSchema,
});

const program = new Command();

async function main() {
  const version = await getPackageVersion();

  program
    .name("mockapi-local")
    .description("A smart local mock REST API server from a JSON schema file")
    .version(version);

  /**
   * Serve command — starts the mock API server from a schema file.
   */
  program
    .command("serve")
    .description("Start the mock API server from a schema file")
    .argument("<schema>", "Path to the JSON schema file")
    .option("-p, --port <port>", "Port to listen on", "3000")
    .option("-H, --host <host>", "Host to bind to", "0.0.0.0")
    .action(async (schemaFile, options) => {
      const schemaPath = resolve(schemaFile);

      // Check file exists
      try {
        await access(schemaPath);
      } catch {
        console.error(
          chalk.red.bold("\n  ✖ Schema file not found: ") +
            chalk.white(schemaPath)
        );
        console.error(
          chalk.gray(
            "\n  Run " +
              chalk.cyan("mockapi-local init") +
              " to generate a sample schema.json\n"
          )
        );
        process.exit(1);
      }

      // Read and parse JSON
      let rawContent;
      try {
        rawContent = await readFile(schemaPath, "utf-8");
      } catch (err) {
        console.error(
          chalk.red.bold("\n  ✖ Could not read schema file: ") +
            chalk.white(err.message) +
            "\n"
        );
        process.exit(1);
      }

      let rawSchema;
      try {
        rawSchema = JSON.parse(rawContent);
      } catch (err) {
        console.error(
          chalk.red.bold("\n  ✖ Invalid JSON in schema file: ") +
            chalk.white(err.message)
        );
        console.error(
          chalk.gray(
            "\n  Check your schema.json for syntax errors (missing commas, trailing commas, etc.)\n"
          )
        );
        process.exit(1);
      }

      // Validate with Zod
      const result = schemaFileSchema.safeParse(rawSchema);
      if (!result.success) {
        console.error(chalk.red.bold("\n  ✖ Schema validation errors:\n"));
        for (const issue of result.error.issues) {
          const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
          console.error(
            chalk.gray("    →") +
              chalk.yellow(` ${path}: `) +
              chalk.white(issue.message)
          );
        }
        console.error("");
        process.exit(1);
      }

      const schema = result.data;

      // Validate port
      const port = parseInt(options.port, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(
          chalk.red.bold("\n  ✖ Invalid port number: ") +
            chalk.white(`"${options.port}". Must be between 1 and 65535.\n`)
        );
        process.exit(1);
      }

      // Validate ref targets exist
      for (const [name, def] of Object.entries(schema.resources)) {
        for (const [fieldName, fieldDef] of Object.entries(def.fields)) {
          if (
            typeof fieldDef === "object" &&
            fieldDef.type === "ref" &&
            !schema.resources[fieldDef.resource]
          ) {
            console.error(
              chalk.red.bold("\n  ✖ Invalid reference: ") +
                chalk.white(
                  `"${name}.${fieldName}" references resource "${fieldDef.resource}" which does not exist.\n`
                )
            );
            process.exit(1);
          }
        }

        // Validate relation targets exist
        if (def.relations) {
          for (const [relName, target] of Object.entries(def.relations)) {
            if (!schema.resources[target]) {
              console.error(
                chalk.red.bold("\n  ✖ Invalid relation: ") +
                  chalk.white(
                    `"${name}.relations.${relName}" targets resource "${target}" which does not exist.\n`
                  )
              );
              process.exit(1);
            }
          }
        }
      }

      // Start server
      try {
        await startServer(schema, {
          port,
          host: options.host,
          schemaPath: schemaFile,
        });
      } catch (err) {
        console.error(
          chalk.red.bold("\n  ✖ Server error: ") +
            chalk.white(err.message) +
            "\n"
        );
        process.exit(1);
      }
    });

  /**
   * Init command — generates a sample schema.json file.
   */
  program
    .command("init")
    .description("Generate a sample schema.json file")
    .option("-o, --output <path>", "Output file path", "schema.json")
    .option("-f, --force", "Overwrite existing file")
    .action(async (options) => {
      const outputPath = resolve(options.output);

      // Check if file exists (unless --force)
      if (!options.force) {
        try {
          await access(outputPath);
          console.error(
            chalk.yellow.bold("\n  ⚠ File already exists: ") +
              chalk.white(outputPath)
          );
          console.error(
            chalk.gray(
              "  Use --force to overwrite, or --output <path> for a different filename\n"
            )
          );
          process.exit(1);
        } catch {
          // File doesn't exist, good
        }
      }

      const sampleSchema = {
        resources: {
          users: {
            count: 20,
            fields: {
              id: "uuid",
              name: "fullName",
              email: "email",
              age: { type: "number", min: 18, max: 65 },
              role: {
                type: "enum",
                values: ["admin", "user", "moderator"],
              },
              avatar: "avatar",
              bio: "sentence",
              createdAt: "date",
            },
            relations: {
              posts: "posts",
              comments: "comments",
            },
          },
          posts: {
            count: 50,
            fields: {
              id: "uuid",
              title: "sentence",
              body: "paragraph",
              userId: { type: "ref", resource: "users" },
              tags: { type: "array", item: "word", length: 3 },
              published: "boolean",
              createdAt: "date",
            },
            relations: {
              comments: "comments",
            },
          },
          comments: {
            count: 100,
            fields: {
              id: "uuid",
              body: "sentence",
              userId: { type: "ref", resource: "users" },
              postId: { type: "ref", resource: "posts" },
              createdAt: "date",
            },
          },
        },
        config: {
          delay: 200,
          errorRate: 0.05,
        },
      };

      try {
        await writeFile(
          outputPath,
          JSON.stringify(sampleSchema, null, 2) + "\n"
        );
        console.log(
          chalk.green.bold("\n  ✔ Created ") + chalk.white(outputPath) + "\n"
        );
        console.log(chalk.gray("  Start the server with:\n"));
        console.log(chalk.cyan(`    mockapi-local serve ${options.output}\n`));
      } catch (err) {
        console.error(
          chalk.red.bold("\n  ✖ Could not write file: ") +
            chalk.white(err.message) +
            "\n"
        );
        process.exit(1);
      }
    });

  program.parse();
}

main().catch((err) => {
  console.error(
    chalk.red.bold("\n  ✖ Fatal error: ") + chalk.white(err.message) + "\n"
  );
  process.exit(1);
});
