# mockapi-local

![npm version](https://img.shields.io/npm/v/mockapi-local)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

A smart local mock REST API server generated from a JSON schema file. Generate realistic fake data, full CRUD endpoints, relational queries, and an OpenAPI spec — all from a single config file.

---

## ⚡ Quick Start

```bash
# Install globally
npm install -g mockapi-local

# Generate a sample schema
mockapi-local init

# Start the server
mockapi-local serve schema.json --port 3000
```

Your mock API is now running at `http://localhost:3000` 🚀

---

## 📖 CLI Usage

### `mockapi-local serve <schema> [options]`

Start the mock API server from a schema file.

| Option              | Default   | Description       |
| ------------------- | --------- | ----------------- |
| `-p, --port <n>`    | `3000`    | Port to listen on |
| `-h, --host <addr>` | `0.0.0.0` | Host to bind to   |

```bash
mockapi-local serve schema.json --port 8080
mockapi-local serve schema.json --host 127.0.0.1 --port 4000
```

### `mockapi-local init [options]`

Generate a sample `schema.json` file.

| Option             | Default       | Description             |
| ------------------ | ------------- | ----------------------- |
| `-o, --output <p>` | `schema.json` | Output file path        |
| `-f, --force`      | `false`       | Overwrite existing file |

```bash
mockapi-local init --output my-api.json
mockapi-local init --force  # overwrite existing schema.json
```

---

## 📐 Schema Format

The schema file defines your resources, their fields, relationships, and server configuration.

```json
{
  "resources": {
    "users": {
      "count": 20,
      "fields": {
        "id": "uuid",
        "name": "fullName",
        "email": "email",
        "age": { "type": "number", "min": 18, "max": 65 },
        "role": { "type": "enum", "values": ["admin", "user", "moderator"] },
        "createdAt": "date"
      },
      "relations": {
        "posts": "posts"
      }
    },
    "posts": {
      "count": 50,
      "fields": {
        "id": "uuid",
        "title": "sentence",
        "body": "paragraph",
        "userId": { "type": "ref", "resource": "users" },
        "tags": { "type": "array", "item": "word", "length": 3 }
      }
    }
  },
  "config": {
    "delay": 200,
    "errorRate": 0.05
  }
}
```

### Field Type Reference

#### String Shorthand Types

**Identifiers**

| Type           | Description                | Example Output               |
| -------------- | -------------------------- | ---------------------------- |
| `uuid`         | UUID v4                    | `"a1b2c3d4-e5f6-..."`        |
| `id`           | UUID v4 (alias)            | `"a1b2c3d4-e5f6-..."`        |
| `nanoid`       | Nano ID                    | `"V1StGXR8_Z5jdHi6B-myT"`    |
| `alphanumeric` | Alphanumeric string (10ch) | `"x7Kp2mN9qR"`               |
| `numeric`      | Numeric string (8 digits)  | `"47291053"`                 |
| `mongoId`      | MongoDB ObjectId           | `"507f1f77bcf86cd799439011"` |

**Personal**

| Type          | Description      | Example Output                   |
| ------------- | ---------------- | -------------------------------- |
| `fullName`    | Full person name | `"Jane Doe"`                     |
| `firstName`   | First name       | `"Jane"`                         |
| `lastName`    | Last name        | `"Doe"`                          |
| `email`       | Email address    | `"jane.doe@example.com"`         |
| `phone`       | Phone number     | `"+1-555-123-4567"`              |
| `username`    | Username         | `"jane_doe42"`                   |
| `displayName` | Display name     | `"Jane42"`                       |
| `avatar`      | Avatar image URL | `"https://avatars.../photo.jpg"` |
| `bio`         | Short biography  | `"Passionate developer..."`      |
| `jobTitle`    | Job title        | `"Software Engineer"`            |
| `jobArea`     | Job area         | `"Communications"`               |
| `sex`         | Biological sex   | `"male"`                         |
| `gender`      | Gender           | `"Non-binary"`                   |

**Text**

| Type        | Description      | Example Output                    |
| ----------- | ---------------- | --------------------------------- |
| `word`      | Random word      | `"consectetur"`                   |
| `words`     | Random words     | `"qui quae quia"`                 |
| `sentence`  | Random sentence  | `"The quick brown fox..."`        |
| `paragraph` | Random paragraph | `"Lorem ipsum dolor sit amet..."` |
| `slug`      | URL slug         | `"random-generated-slug"`         |
| `text`      | Block of text    | `"Lorem ipsum dolor..."`          |

**Numbers**

| Type      | Description             | Example Output |
| --------- | ----------------------- | -------------- |
| `number`  | Random integer (1-1000) | `42`           |
| `float`   | Random decimal          | `3.14`         |
| `boolean` | True or false           | `true`         |

**Dates**

| Type         | Description     | Example Output               |
| ------------ | --------------- | ---------------------------- |
| `date`       | Recent ISO date | `"2024-03-15T10:30:00.000Z"` |
| `pastDate`   | Past date       | `"2023-01-10T08:00:00.000Z"` |
| `futureDate` | Future date     | `"2025-08-20T15:00:00.000Z"` |
| `birthdate`  | Birth date      | `"1990-05-15T00:00:00.000Z"` |
| `timestamp`  | Unix timestamp  | `1710500000000`              |

**Internet**

| Type         | Description       | Example Output                    |
| ------------ | ----------------- | --------------------------------- |
| `url`        | URL               | `"https://example.com"`           |
| `imageUrl`   | Image URL         | `"https://picsum.photos/640/480"` |
| `avatarUrl`  | Avatar URL        | `"https://avatars.../photo.jpg"`  |
| `ip`         | IPv4 address      | `"192.168.1.1"`                   |
| `ipv6`       | IPv6 address      | `"2001:0db8:85a3:..."`            |
| `mac`        | MAC address       | `"00:1A:2B:3C:4D:5E"`             |
| `userAgent`  | User agent string | `"Mozilla/5.0 ..."`               |
| `domainName` | Domain name       | `"example.com"`                   |
| `password`   | Random password   | `"x7Kp2mN9qR!@"`                  |
| `jwt`        | JWT token         | `"eyJhbGciOiJIUzI1NiJ9..."`       |
| `emoji`      | Random emoji      | `"😂"`                            |
| `color`      | RGB color         | `"#ff6b6b"`                       |
| `colorName`  | Color name        | `"salmon"`                        |

**Location**

| Type            | Description     | Example Output          |
| --------------- | --------------- | ----------------------- |
| `country`       | Country name    | `"United States"`       |
| `countryCode`   | Country code    | `"US"`                  |
| `state`         | State/province  | `"California"`          |
| `city`          | City name       | `"San Francisco"`       |
| `address`       | Street address  | `"123 Main St"`         |
| `streetAddress` | Street address  | `"123 Main St"`         |
| `zipCode`       | ZIP/postal code | `"94105"`               |
| `latitude`      | Latitude        | `37.7749`               |
| `longitude`     | Longitude       | `-122.4194`             |
| `timeZone`      | Time zone       | `"America/Los_Angeles"` |

**Commerce & Finance**

| Type                 | Description         | Example Output                   |
| -------------------- | ------------------- | -------------------------------- |
| `price`              | Price string        | `"29.99"`                        |
| `productName`        | Product name        | `"Ergonomic Chair"`              |
| `productDescription` | Product description | `"The beautiful range of..."`    |
| `company`            | Company name        | `"Acme Corp"`                    |
| `isbn`               | ISBN number         | `"978-3-16-148410-0"`            |
| `iban`               | IBAN                | `"DE89370400440532013000"`       |
| `creditCard`         | Credit card number  | `"4111-1111-1111-1111"`          |
| `currencyCode`       | Currency code       | `"USD"`                          |
| `bitcoinAddress`     | Bitcoin address     | `"1A1zP1eP5QGefi2DMPTfTL5SLmv7"` |

**System**

| Type       | Description    | Example Output                    |
| ---------- | -------------- | --------------------------------- |
| `fileName` | File name      | `"report.pdf"`                    |
| `fileExt`  | File extension | `"pdf"`                           |
| `mimeType` | MIME type      | `"application/pdf"`               |
| `image`    | Image URL      | `"https://picsum.photos/640/480"` |

> **Dynamic Resolution**: If a type name isn't in the built-in list, mockapi-local will automatically search through all faker.js modules to find a matching method. As a last resort, it falls back to a random word — it will **never** throw an error on an unknown type.

#### Object Type Definitions

| Type      | Options                         | Description                      |
| --------- | ------------------------------- | -------------------------------- |
| `number`  | `min`, `max`                    | Integer within range             |
| `float`   | `min`, `max`, `precision`       | Decimal within range             |
| `enum`    | `values` (array)                | Random pick from provided values |
| `ref`     | `resource` (resource name)      | Foreign key to another resource  |
| `array`   | `item` (type), `length` (count) | Array of generated values        |
| `object`  | `fields` (field definitions)    | Nested object                    |
| `boolean` | —                               | Random true/false                |

---

## 🛣️ Auto-Generated Endpoints

For each resource defined in your schema, the following endpoints are auto-generated:

| Method   | Path                         | Description       |
| -------- | ---------------------------- | ----------------- |
| `GET`    | `/<resource>`                | List (paginated)  |
| `GET`    | `/<resource>/:id`            | Get by ID         |
| `POST`   | `/<resource>`                | Create            |
| `PUT`    | `/<resource>/:id`            | Full update       |
| `PATCH`  | `/<resource>/:id`            | Partial update    |
| `DELETE` | `/<resource>/:id`            | Delete            |
| `GET`    | `/<resource>/:id/<relation>` | Get related items |
| `GET`    | `/_spec`                     | OpenAPI 3.0 spec  |

### Query Parameters

| Parameter | Default | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| `page`    | `1`     | Page number                                    |
| `limit`   | `10`    | Items per page                                 |
| `sort`    | —       | Field name to sort by                          |
| `order`   | `asc`   | Sort order: `asc` or `desc`                    |
| `<field>` | —       | Filter by any field value (e.g. `?role=admin`) |

### Response Headers

| Header           | Description             |
| ---------------- | ----------------------- |
| `X-Total-Count`  | Total number of records |
| `X-Total-Pages`  | Total number of pages   |
| `X-Current-Page` | Current page number     |
| `X-Per-Page`     | Items per page          |

---

## 📝 Endpoint Examples

### List users with pagination

```bash
curl http://localhost:3000/users?page=1&limit=5
```

### Filter users by role

```bash
curl http://localhost:3000/users?role=admin
```

### Sort users by name (descending)

```bash
curl "http://localhost:3000/users?sort=name&order=desc"
```

### Get a single user

```bash
curl http://localhost:3000/users/<user-id>
```

### Create a new user

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30, "role": "user"}'
```

### Update a user (full replace)

```bash
curl -X PUT http://localhost:3000/users/<user-id> \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith", "email": "john.smith@example.com", "age": 31, "role": "admin"}'
```

### Partial update

```bash
curl -X PATCH http://localhost:3000/users/<user-id> \
  -H "Content-Type: application/json" \
  -d '{"role": "moderator"}'
```

### Delete a user

```bash
curl -X DELETE http://localhost:3000/users/<user-id>
```

### Get a user's posts (relation)

```bash
curl http://localhost:3000/users/<user-id>/posts
```

### Get OpenAPI spec

```bash
curl http://localhost:3000/_spec
```

---

## ⚙️ Configuration

The `config` section in your schema controls server behavior:

```json
{
  "config": {
    "delay": 200,
    "errorRate": 0.05
  }
}
```

| Option      | Type     | Default | Description                                       |
| ----------- | -------- | ------- | ------------------------------------------------- |
| `delay`     | `number` | `0`     | Simulated network latency in milliseconds         |
| `errorRate` | `number` | `0`     | Probability (0–1) of returning a random 500 error |

---

## 🔑 Smart Features

- **🔗 Relational Integrity** — `ref` fields always point to real IDs from the referenced resource
- **💾 Session Persistence** — POST, PUT, PATCH, DELETE operations persist in memory for the session
- **⏱️ Configurable Delay** — Simulate real-world network latency
- **💥 Error Simulation** — Randomly return 500 errors to test error handling
- **📝 Request Logging** — Colorful terminal output with method, path, status, and duration
- **🌐 Auto CORS** — Cross-origin requests enabled by default
- **📋 OpenAPI Spec** — Auto-generated OpenAPI 3.0 at `GET /_spec`
- **🔄 Dependency Resolution** — Resources are generated in the correct order based on ref dependencies
- **✅ Schema Validation** — Zod-powered validation with clear error messages
- **🔀 Dynamic Type Resolution** — Unknown field types are auto-resolved from faker.js modules
- **🛑 Graceful Shutdown** — Clean server stop on SIGINT/SIGTERM

---

## 📦 Programmatic Usage

You can also use mockapi-local programmatically:

```javascript
import { startServer } from "mockapi-local";

const schema = {
  resources: {
    users: {
      count: 10,
      fields: {
        id: "uuid",
        name: "fullName",
        email: "email",
      },
    },
  },
};

const app = await startServer(schema, { port: 3000 });
```

---

## 🏆 Comparison: mockapi-local vs json-server

| Feature                 | mockapi-local       | json-server    |
| ----------------------- | ------------------- | -------------- |
| Data Generation         | ✅ Auto (Faker)     | ❌ Manual JSON |
| Schema-Driven           | ✅ Yes              | ❌ No          |
| Schema Validation       | ✅ Zod-powered      | ❌ No          |
| Relational Integrity    | ✅ Automatic        | ⚠️ Manual      |
| Pagination Headers      | ✅ Built-in         | ✅ Built-in    |
| Filtering               | ✅ Any field        | ✅ Any field   |
| Sorting                 | ✅ Built-in         | ✅ Built-in    |
| OpenAPI Spec            | ✅ Auto-generated   | ❌ No          |
| Latency Simulation      | ✅ Configurable     | ❌ No          |
| Error Rate Simulation   | ✅ Configurable     | ❌ No          |
| Nested/Relation Routes  | ✅ Auto from schema | ⚠️ Limited     |
| Request Logging         | ✅ Colorful         | ✅ Basic       |
| Performance (Fastify)   | ✅ Fast             | ⚠️ Express     |
| CORS                    | ✅ Auto             | ✅ Auto        |
| Field Type Variety      | ✅ 60+ types        | ❌ N/A         |
| Dynamic Type Resolution | ✅ Auto-resolve     | ❌ N/A         |
| Graceful Shutdown       | ✅ Yes              | ❌ No          |

---

## 📄 License

MIT
