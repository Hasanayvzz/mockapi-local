import { faker } from "@faker-js/faker";

/**
 * Generate a single field value based on its type definition.
 * @param {string|object} fieldDef - Field type string or object definition
 * @param {object} context - Generation context with existing resource stores
 * @returns {*} Generated value matching the field definition
 */
export function generateFieldValue(fieldDef, context = {}) {
  // String shorthand types
  if (typeof fieldDef === "string") {
    return generateByType(fieldDef, context);
  }

  // Object type definitions
  if (typeof fieldDef === "object" && fieldDef !== null) {
    return generateByObjectDef(fieldDef, context);
  }

  return null;
}

/**
 * Generate a value from a string type shorthand.
 * @param {string} type - Type name like "uuid", "email", "fullName", etc.
 * @param {object} context - Generation context
 * @returns {*} Generated value
 */
function generateByType(type, context) {
  const generators = {
    // Identifiers
    uuid: () => faker.string.uuid(),
    id: () => faker.string.uuid(),
    nanoid: () => faker.string.nanoid(),
    alphanumeric: () => faker.string.alphanumeric(10),
    numeric: () => faker.string.numeric(8),
    hex: () => faker.string.hexadecimal({ length: 8 }),

    // Personal
    fullName: () => faker.person.fullName(),
    firstName: () => faker.person.firstName(),
    lastName: () => faker.person.lastName(),
    middleName: () => faker.person.middleName(),
    prefix: () => faker.person.prefix(),
    suffix: () => faker.person.suffix(),
    sex: () => faker.person.sex(),
    gender: () => faker.person.gender(),
    email: () => faker.internet.email(),
    phone: () => faker.phone.number(),
    phoneNumber: () => faker.phone.number(),
    avatar: () => faker.image.avatar(),
    username: () => faker.internet.username(),
    displayName: () => faker.internet.displayName(),
    bio: () => faker.person.bio(),
    jobTitle: () => faker.person.jobTitle(),
    jobArea: () => faker.person.jobArea(),
    jobType: () => faker.person.jobType(),

    // Text
    word: () => faker.lorem.word(),
    words: () => faker.lorem.words(),
    sentence: () => faker.lorem.sentence(),
    sentences: () => faker.lorem.sentences(),
    paragraph: () => faker.lorem.paragraph(),
    paragraphs: () => faker.lorem.paragraphs(),
    slug: () => faker.lorem.slug(),
    text: () => faker.lorem.text(),
    lines: () => faker.lorem.lines(),

    // Numbers
    number: () => faker.number.int({ min: 1, max: 1000 }),
    int: () => faker.number.int({ min: 1, max: 1000 }),
    integer: () => faker.number.int({ min: 1, max: 1000 }),
    float: () => faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
    decimal: () => faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),

    // Dates
    date: () => faker.date.recent({ days: 365 }).toISOString(),
    pastDate: () => faker.date.past().toISOString(),
    futureDate: () => faker.date.future().toISOString(),
    recentDate: () => faker.date.recent().toISOString(),
    soonDate: () => faker.date.soon().toISOString(),
    birthdate: () => faker.date.birthdate().toISOString(),
    timestamp: () => faker.date.recent().getTime(),

    // Internet
    url: () => faker.internet.url(),
    imageUrl: () => faker.image.url(),
    avatarUrl: () => faker.image.avatar(),
    ip: () => faker.internet.ip(),
    ipv4: () => faker.internet.ipv4(),
    ipv6: () => faker.internet.ipv6(),
    mac: () => faker.internet.mac(),
    userAgent: () => faker.internet.userAgent(),
    protocol: () => faker.internet.protocol(),
    domainName: () => faker.internet.domainName(),
    domainWord: () => faker.internet.domainWord(),
    httpMethod: () => faker.internet.httpMethod(),
    httpStatusCode: () => faker.internet.httpStatusCode(),
    emoji: () => faker.internet.emoji(),
    password: () => faker.internet.password(),
    jwt: () => faker.internet.jwt(),
    color: () => faker.color.rgb(),
    hexColor: () => faker.color.rgb(),
    colorName: () => faker.color.human(),

    // Location
    country: () => faker.location.country(),
    countryCode: () => faker.location.countryCode(),
    state: () => faker.location.state(),
    city: () => faker.location.city(),
    address: () => faker.location.streetAddress(),
    streetAddress: () => faker.location.streetAddress(),
    street: () => faker.location.street(),
    secondaryAddress: () => faker.location.secondaryAddress(),
    zipCode: () => faker.location.zipCode(),
    latitude: () => faker.location.latitude(),
    longitude: () => faker.location.longitude(),
    timeZone: () => faker.location.timeZone(),
    county: () => faker.location.county(),

    // Commerce
    price: () => faker.commerce.price(),
    productName: () => faker.commerce.productName(),
    productDescription: () => faker.commerce.productDescription(),
    productCategory: () => faker.commerce.department(),
    department: () => faker.commerce.department(),
    productMaterial: () => faker.commerce.productMaterial(),
    productAdjective: () => faker.commerce.productAdjective(),
    isbn: () => faker.commerce.isbn(),
    company: () => faker.company.name(),
    companyName: () => faker.company.name(),
    catchPhrase: () => faker.company.catchPhrase(),
    buzzPhrase: () => faker.company.buzzPhrase(),

    // Finance
    currency: () => faker.finance.currencyCode(),
    currencyCode: () => faker.finance.currencyCode(),
    currencyName: () => faker.finance.currencyName(),
    creditCard: () => faker.finance.creditCardNumber(),
    iban: () => faker.finance.iban(),
    bic: () => faker.finance.bic(),
    bitcoinAddress: () => faker.finance.bitcoinAddress(),
    accountNumber: () => faker.finance.accountNumber(),

    // Boolean
    boolean: () => faker.datatype.boolean(),

    // Image
    image: () => faker.image.url(),

    // System / File
    fileName: () => faker.system.fileName(),
    fileExt: () => faker.system.fileExt(),
    mimeType: () => faker.system.mimeType(),
    filePath: () => faker.system.filePath(),

    // Vehicle
    vehicle: () => faker.vehicle.vehicle(),
    vehicleModel: () => faker.vehicle.model(),
    vehicleType: () => faker.vehicle.type(),
    vin: () => faker.vehicle.vin(),

    // Database
    mongoId: () => faker.database.mongodbObjectId(),
    column: () => faker.database.column(),
    dbType: () => faker.database.type(),
    engine: () => faker.database.engine(),
    collation: () => faker.database.collation(),
  };

  const generator = generators[type];
  if (generator) {
    return generator();
  }

  // Dynamic fallback: try to find a matching faker method
  const resolved = resolveFakerMethod(type);
  if (resolved !== undefined) {
    return resolved;
  }

  // Last resort: return a random word (never throw on unknown types)
  console.warn(
    `  ⚠ Unknown field type "${type}" — falling back to random word`
  );
  return faker.lorem.word();
}

/**
 * Try to dynamically resolve a faker method by searching through faker modules.
 * Supports camelCase type names like "streetAddress" → faker.location.streetAddress()
 * @param {string} type - Type name to resolve
 * @returns {*|undefined} Generated value or undefined if not found
 */
function resolveFakerMethod(type) {
  // Modules to search through in faker
  const modules = [
    "person",
    "internet",
    "location",
    "commerce",
    "company",
    "finance",
    "lorem",
    "image",
    "date",
    "phone",
    "color",
    "number",
    "string",
    "datatype",
    "system",
    "vehicle",
    "database",
    "science",
    "music",
    "airline",
    "food",
    "book",
  ];

  for (const moduleName of modules) {
    const mod = faker[moduleName];
    if (mod && typeof mod[type] === "function") {
      try {
        const result = mod[type]();
        // If it's a Date, convert to ISO string
        if (result instanceof Date) return result.toISOString();
        return result;
      } catch {
        continue;
      }
    }
  }

  return undefined;
}

/**
 * Generate a value from an object field definition.
 * @param {object} def - Object definition with type and options
 * @param {object} context - Generation context with stores
 * @returns {*} Generated value
 */
function generateByObjectDef(def, context) {
  switch (def.type) {
    case "number":
      return faker.number.int({
        min: def.min ?? 0,
        max: def.max ?? 1000,
      });

    case "float":
      return faker.number.float({
        min: def.min ?? 0,
        max: def.max ?? 1000,
        fractionDigits: def.precision ?? 2,
      });

    case "enum":
      if (!Array.isArray(def.values) || def.values.length === 0) {
        throw new Error('Enum field must have a non-empty "values" array');
      }
      return faker.helpers.arrayElement(def.values);

    case "ref": {
      if (!def.resource) {
        throw new Error('Ref field must specify a "resource" name');
      }
      const refStore = context.stores?.[def.resource];
      if (!refStore || refStore.length === 0) {
        throw new Error(
          `Cannot resolve ref to "${def.resource}" — resource not found or empty. ` +
            `Ensure "${def.resource}" is defined before resources that reference it.`
        );
      }
      const refItem = faker.helpers.arrayElement(refStore);
      return refItem.id;
    }

    case "array": {
      const length = def.length ?? 3;
      const items = [];
      for (let i = 0; i < length; i++) {
        items.push(generateFieldValue(def.item, context));
      }
      return items;
    }

    case "object": {
      if (!def.fields || typeof def.fields !== "object") {
        throw new Error('Object field must have a "fields" definition');
      }
      const obj = {};
      for (const [key, subDef] of Object.entries(def.fields)) {
        obj[key] = generateFieldValue(subDef, context);
      }
      return obj;
    }

    default:
      // If type matches a string shorthand, use it
      if (def.type) {
        return generateByType(def.type, context);
      }
      throw new Error(
        `Invalid field definition: ${JSON.stringify(
          def
        )}. Must include a valid "type" property.`
      );
  }
}

/**
 * Generate a single record for a given resource definition.
 * @param {object} fields - Resource field definitions
 * @param {object} context - Generation context
 * @returns {object} Generated record
 */
export function generateRecord(fields, context = {}) {
  const record = {};
  for (const [fieldName, fieldDef] of Object.entries(fields)) {
    record[fieldName] = generateFieldValue(fieldDef, context);
  }
  return record;
}

/**
 * Generate all data for all resources defined in the schema.
 * Handles generation order to satisfy referential dependencies.
 * @param {object} schema - Full schema object with resources
 * @returns {object} Map of resource name to array of generated records
 */
export function generateAllData(schema) {
  const { resources } = schema;
  const stores = {};

  // Build a dependency graph to determine generation order
  const order = resolveGenerationOrder(resources);

  for (const resourceName of order) {
    const resource = resources[resourceName];
    const count = resource.count ?? 10;
    const context = { stores };

    stores[resourceName] = [];
    for (let i = 0; i < count; i++) {
      const record = generateRecord(resource.fields, context);
      stores[resourceName].push(record);
    }
  }

  return stores;
}

/**
 * Resolve the order in which resources should be generated,
 * ensuring that referenced resources are generated first.
 * @param {object} resources - Resource definitions from schema
 * @returns {string[]} Ordered list of resource names
 */
function resolveGenerationOrder(resources) {
  const resourceNames = Object.keys(resources);
  const visited = new Set();
  const order = [];

  function visit(name, chain = []) {
    if (visited.has(name)) return;
    if (chain.includes(name)) {
      throw new Error(
        `Circular dependency detected: ${[...chain, name].join(" → ")}. ` +
          `Resources cannot have circular references.`
      );
    }

    const resource = resources[name];
    if (!resource) {
      throw new Error(
        `Resource "${name}" referenced but not defined in schema.`
      );
    }

    // Find dependencies (ref fields)
    for (const fieldDef of Object.values(resource.fields)) {
      if (typeof fieldDef === "object" && fieldDef?.type === "ref") {
        visit(fieldDef.resource, [...chain, name]);
      }
    }

    visited.add(name);
    order.push(name);
  }

  for (const name of resourceNames) {
    visit(name);
  }

  return order;
}
