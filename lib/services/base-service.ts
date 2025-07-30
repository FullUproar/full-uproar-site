import { PrismaClient } from '@prisma/client';
import { NotFoundError, handlePrismaError } from '@/lib/utils/errors';
import { logger, PerformanceTracker } from '@/lib/utils/logger';

export interface FindManyOptions {
  where?: any;
  orderBy?: any;
  skip?: number;
  take?: number;
  include?: any;
  select?: any;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Base service class for data access with common CRUD operations
 */
export abstract class BaseService<T, CreateInput, UpdateInput> {
  constructor(
    protected prisma: PrismaClient,
    protected modelName: string
  ) {}

  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Find a single record by ID
   */
  async findById(id: number | string, include?: any): Promise<T> {
    const tracker = new PerformanceTracker(`${this.modelName}.findById`);
    
    try {
      const result = await this.model.findUnique({
        where: { id },
        include
      });

      if (!result) {
        throw new NotFoundError(this.modelName, String(id));
      }

      tracker.end({ id });
      return result;
    } catch (error) {
      tracker.end({ id, error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Find a single record by criteria
   */
  async findOne(where: any, include?: any): Promise<T | null> {
    const tracker = new PerformanceTracker(`${this.modelName}.findOne`);
    
    try {
      const result = await this.model.findFirst({
        where,
        include
      });

      tracker.end({ found: !!result });
      return result;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Find multiple records
   */
  async findMany(options?: FindManyOptions): Promise<T[]> {
    const tracker = new PerformanceTracker(`${this.modelName}.findMany`);
    
    try {
      const results = await this.model.findMany(options);
      tracker.end({ count: results.length });
      return results;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Find records with pagination
   */
  async findManyPaginated(
    options: FindManyOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const tracker = new PerformanceTracker(`${this.modelName}.findManyPaginated`);
    
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.model.findMany({
          ...options,
          skip,
          take: limit
        }),
        this.model.count({ where: options.where })
      ]);

      const result: PaginatedResult<T> = {
        data,
        pagination: {
          page,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

      tracker.end({ page, count: data.length, total });
      return result;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Count records
   */
  async count(where?: any): Promise<number> {
    const tracker = new PerformanceTracker(`${this.modelName}.count`);
    
    try {
      const count = await this.model.count({ where });
      tracker.end({ count });
      return count;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput, include?: any): Promise<T> {
    const tracker = new PerformanceTracker(`${this.modelName}.create`);
    
    try {
      const result = await this.model.create({
        data,
        include
      });

      logger.info(`Created ${this.modelName}`, { id: result.id });
      tracker.end({ id: result.id });
      return result;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Create multiple records
   */
  async createMany(data: CreateInput[]): Promise<{ count: number }> {
    const tracker = new PerformanceTracker(`${this.modelName}.createMany`);
    
    try {
      const result = await this.model.createMany({
        data,
        skipDuplicates: true
      });

      logger.info(`Created ${result.count} ${this.modelName} records`);
      tracker.end({ count: result.count });
      return result;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: number | string, data: UpdateInput, include?: any): Promise<T> {
    const tracker = new PerformanceTracker(`${this.modelName}.update`);
    
    try {
      const result = await this.model.update({
        where: { id },
        data,
        include
      });

      logger.info(`Updated ${this.modelName}`, { id });
      tracker.end({ id });
      return result;
    } catch (error) {
      tracker.end({ id, error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Update multiple records
   */
  async updateMany(where: any, data: UpdateInput): Promise<{ count: number }> {
    const tracker = new PerformanceTracker(`${this.modelName}.updateMany`);
    
    try {
      const result = await this.model.updateMany({
        where,
        data
      });

      logger.info(`Updated ${result.count} ${this.modelName} records`);
      tracker.end({ count: result.count });
      return result;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number | string): Promise<T> {
    const tracker = new PerformanceTracker(`${this.modelName}.delete`);
    
    try {
      const result = await this.model.delete({
        where: { id }
      });

      logger.info(`Deleted ${this.modelName}`, { id });
      tracker.end({ id });
      return result;
    } catch (error) {
      tracker.end({ id, error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Delete multiple records
   */
  async deleteMany(where: any): Promise<{ count: number }> {
    const tracker = new PerformanceTracker(`${this.modelName}.deleteMany`);
    
    try {
      const result = await this.model.deleteMany({ where });

      logger.info(`Deleted ${result.count} ${this.modelName} records`);
      tracker.end({ count: result.count });
      return result;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }

  /**
   * Check if a record exists
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Execute a transaction
   */
  async transaction<R>(
    fn: (tx: PrismaClient) => Promise<R>
  ): Promise<R> {
    const tracker = new PerformanceTracker(`${this.modelName}.transaction`);
    
    try {
      const result = await this.prisma.$transaction(fn);
      tracker.end();
      return result;
    } catch (error) {
      tracker.end({ error: true });
      throw handlePrismaError(error);
    }
  }
}