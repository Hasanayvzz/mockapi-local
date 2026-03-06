import { randomUUID } from "node:crypto";

/**
 * In-memory data store for mock API resources.
 * Provides CRUD operations with pagination, filtering, and sorting.
 */
export class Store {
  /**
   * Create a new Store instance.
   * @param {object} initialData - Map of resource name to array of records
   * @param {object} schema - Original schema for validation context
   */
  constructor(initialData = {}, schema = {}) {
    /** @type {Map<string, object[]>} */
    this.data = new Map();
    /** @type {object} */
    this.schema = schema;

    for (const [resource, records] of Object.entries(initialData)) {
      this.data.set(resource, [...records]);
    }
  }

  /**
   * Get all resource names in the store.
   * @returns {string[]}
   */
  getResourceNames() {
    return [...this.data.keys()];
  }

  /**
   * Check if a resource exists in the store.
   * @param {string} resource - Resource name
   * @returns {boolean}
   */
  hasResource(resource) {
    return this.data.has(resource);
  }

  /**
   * List records for a resource with pagination, filtering, and sorting.
   * @param {string} resource - Resource name
   * @param {object} options - Query options
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=10] - Items per page
   * @param {string} [options.sort] - Field to sort by
   * @param {string} [options.order='asc'] - Sort order ('asc' or 'desc')
   * @param {object} [options.filters={}] - Field-value pairs for filtering
   * @returns {{ data: object[], total: number, page: number, limit: number, totalPages: number }}
   */
  list(resource, options = {}) {
    const records = this.data.get(resource);
    if (!records) {
      throw new StoreError(`Resource "${resource}" not found`, 404);
    }

    const { page = 1, limit = 10, sort, order = "asc", filters = {} } = options;

    // Filtering
    let filtered = records;
    const filterKeys = Object.keys(filters);
    if (filterKeys.length > 0) {
      filtered = records.filter((record) =>
        filterKeys.every((key) => {
          const filterVal = filters[key];
          const recordVal = record[key];

          if (recordVal === undefined) return false;

          // Array field: check if it includes the filter value
          if (Array.isArray(recordVal)) {
            return recordVal.includes(filterVal);
          }

          // Loose equality for string/number coercion
          return String(recordVal) === String(filterVal);
        })
      );
    }

    // Sorting
    if (sort) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sort];
        const bVal = b[sort];

        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;

        let comparison;
        if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return order === "desc" ? -comparison : comparison;
      });
    }

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get a single record by ID.
   * @param {string} resource - Resource name
   * @param {string} id - Record ID
   * @returns {object} The found record
   * @throws {StoreError} If resource or record not found
   */
  getById(resource, id) {
    const records = this.data.get(resource);
    if (!records) {
      throw new StoreError(`Resource "${resource}" not found`, 404);
    }

    const record = records.find((r) => String(r.id) === String(id));
    if (!record) {
      throw new StoreError(
        `Record with id "${id}" not found in "${resource}"`,
        404
      );
    }

    return record;
  }

  /**
   * Create a new record in a resource.
   * @param {string} resource - Resource name
   * @param {object} data - Record data (id will be auto-generated if missing)
   * @returns {object} The created record
   * @throws {StoreError} If resource not found
   */
  create(resource, data) {
    const records = this.data.get(resource);
    if (!records) {
      throw new StoreError(`Resource "${resource}" not found`, 404);
    }

    const record = {
      id: data.id || randomUUID(),
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
    };

    records.push(record);
    return record;
  }

  /**
   * Full update (replace) a record by ID.
   * @param {string} resource - Resource name
   * @param {string} id - Record ID
   * @param {object} data - New record data
   * @returns {object} The updated record
   * @throws {StoreError} If resource or record not found
   */
  update(resource, id, data) {
    const records = this.data.get(resource);
    if (!records) {
      throw new StoreError(`Resource "${resource}" not found`, 404);
    }

    const index = records.findIndex((r) => String(r.id) === String(id));
    if (index === -1) {
      throw new StoreError(
        `Record with id "${id}" not found in "${resource}"`,
        404
      );
    }

    const updated = { ...data, id };
    records[index] = updated;
    return updated;
  }

  /**
   * Partial update (merge) a record by ID.
   * @param {string} resource - Resource name
   * @param {string} id - Record ID
   * @param {object} data - Partial record data to merge
   * @returns {object} The patched record
   * @throws {StoreError} If resource or record not found
   */
  patch(resource, id, data) {
    const records = this.data.get(resource);
    if (!records) {
      throw new StoreError(`Resource "${resource}" not found`, 404);
    }

    const index = records.findIndex((r) => String(r.id) === String(id));
    if (index === -1) {
      throw new StoreError(
        `Record with id "${id}" not found in "${resource}"`,
        404
      );
    }

    const patched = { ...records[index], ...data, id };
    records[index] = patched;
    return patched;
  }

  /**
   * Delete a record by ID.
   * @param {string} resource - Resource name
   * @param {string} id - Record ID
   * @returns {object} The deleted record
   * @throws {StoreError} If resource or record not found
   */
  delete(resource, id) {
    const records = this.data.get(resource);
    if (!records) {
      throw new StoreError(`Resource "${resource}" not found`, 404);
    }

    const index = records.findIndex((r) => String(r.id) === String(id));
    if (index === -1) {
      throw new StoreError(
        `Record with id "${id}" not found in "${resource}"`,
        404
      );
    }

    const [deleted] = records.splice(index, 1);
    return deleted;
  }

  /**
   * Get related records for a resource's relation.
   * @param {string} parentResource - Parent resource name
   * @param {string} parentId - Parent record ID
   * @param {string} childResource - Child/related resource name
   * @param {object} options - Pagination/filter/sort options
   * @returns {{ data: object[], total: number, page: number, limit: number, totalPages: number }}
   */
  getRelated(parentResource, parentId, childResource, options = {}) {
    // Verify parent exists
    this.getById(parentResource, parentId);

    const childRecords = this.data.get(childResource);
    if (!childRecords) {
      throw new StoreError(`Resource "${childResource}" not found`, 404);
    }

    // Find the foreign key field in the child resource that references the parent
    const parentIdField = this._findForeignKey(childResource, parentResource);

    // Filter child records matching the parent ID
    const related = childRecords.filter(
      (r) => String(r[parentIdField]) === String(parentId)
    );

    // Apply pagination
    const { page = 1, limit = 10, sort, order = "asc" } = options;

    let result = related;

    // Sort
    if (sort) {
      result = [...result].sort((a, b) => {
        const aVal = a[sort];
        const bVal = b[sort];
        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;
        let cmp =
          typeof aVal === "number" && typeof bVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));
        return order === "desc" ? -cmp : cmp;
      });
    }

    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return { data: paginated, total, page, limit, totalPages };
  }

  /**
   * Find the foreign key field name in a child resource that references a parent.
   * @param {string} childResource - Child resource name
   * @param {string} parentResource - Parent resource name
   * @returns {string} Foreign key field name
   * @private
   */
  _findForeignKey(childResource, parentResource) {
    const childDef = this.schema.resources?.[childResource];
    if (childDef?.fields) {
      for (const [fieldName, fieldDef] of Object.entries(childDef.fields)) {
        if (
          typeof fieldDef === "object" &&
          fieldDef.type === "ref" &&
          fieldDef.resource === parentResource
        ) {
          return fieldName;
        }
      }
    }

    // Fallback: try common naming conventions
    const singularParent = parentResource.replace(/s$/, "");
    const candidates = [
      `${singularParent}Id`,
      `${singularParent}_id`,
      `${parentResource}Id`,
    ];

    const childRecords = this.data.get(childResource) || [];
    if (childRecords.length > 0) {
      for (const candidate of candidates) {
        if (candidate in childRecords[0]) {
          return candidate;
        }
      }
    }

    return `${singularParent}Id`;
  }
}

/**
 * Custom error class for store operations.
 */
export class StoreError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "StoreError";
    this.statusCode = statusCode;
  }
}
