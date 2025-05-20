import { and, eq, like, gte, lte, count, sql, desc } from 'drizzle-orm';
import { db } from './db';
import { 
  type User, type InsertUser, users,
  type Lead, type InsertLead, leads,
  type ScrapingSource, type InsertScrapingSource, scrapingSources,
  type ScrapingJob, type InsertScrapingJob, scrapingJobs,
  type Region, type InsertRegion, regions,
} from '@shared/schema';
import { IStorage, LeadFilters, LeadStats } from './storage';

/**
 * Database storage implementation using PostgreSQL and Drizzle ORM
 */
export class DbStorage implements IStorage {
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }
  
  // Lead operations
  async getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
    // Build the query based on filters
    const query = db.select().from(leads);
    
    // Apply location filter
    if (filters.location) {
      query.where(
        sql`(${leads.city} ILIKE ${`%${filters.location}%`} OR ${leads.state} ILIKE ${`%${filters.location}%`})`
      );
    }
    
    // Apply company size filter
    if (filters.companySize) {
      const [min, max] = this.parseCompanySize(filters.companySize);
      if (max === -1) {
        query.where(gte(leads.employeeCount, min));
      } else {
        query.where(and(
          gte(leads.employeeCount, min),
          lte(leads.employeeCount, max)
        ));
      }
    }
    
    // Apply move date filter
    if (filters.moveDate) {
      const { start, end } = this.getDateRange(filters.moveDate);
      query.where(and(
        gte(leads.moveDate, start),
        lte(leads.moveDate, end)
      ));
    }
    
    // Apply email status filter
    if (filters.emailStatus) {
      query.where(eq(leads.emailStatus, filters.emailStatus));
    }
    
    // Apply search filter
    if (filters.search) {
      query.where(
        sql`(
          ${leads.companyName} ILIKE ${`%${filters.search}%`} OR
          ${leads.contactName} ILIKE ${`%${filters.search}%`} OR
          ${leads.contactEmail} ILIKE ${`%${filters.search}%`} OR
          ${leads.industry} ILIKE ${`%${filters.search}%`}
        )`
      );
    }
    
    // Apply ordering (newest first)
    query.orderBy(desc(leads.createdAt));
    
    // Apply pagination
    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query.limit(filters.limit).offset(offset);
    }
    
    return await query;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const results = await db.select().from(leads).where(eq(leads.id, id));
    return results[0];
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const results = await db.insert(leads).values({
      ...lead,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return results[0];
  }

  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    const results = await db.update(leads)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();
    return results[0];
  }

  async deleteLead(id: number): Promise<boolean> {
    const results = await db.delete(leads).where(eq(leads.id, id)).returning();
    return results.length > 0;
  }
  
  // Scraping source operations
  async getScrapingSources(): Promise<ScrapingSource[]> {
    return await db.select().from(scrapingSources);
  }

  async getScrapingSource(id: number): Promise<ScrapingSource | undefined> {
    const results = await db.select().from(scrapingSources).where(eq(scrapingSources.id, id));
    return results[0];
  }

  async createScrapingSource(source: InsertScrapingSource): Promise<ScrapingSource> {
    const results = await db.insert(scrapingSources).values({
      ...source,
      createdAt: new Date(),
    }).returning();
    return results[0];
  }

  async updateScrapingSource(id: number, updateData: Partial<InsertScrapingSource>): Promise<ScrapingSource | undefined> {
    const results = await db.update(scrapingSources)
      .set(updateData)
      .where(eq(scrapingSources.id, id))
      .returning();
    return results[0];
  }

  async deleteScrapingSource(id: number): Promise<boolean> {
    const results = await db.delete(scrapingSources).where(eq(scrapingSources.id, id)).returning();
    return results.length > 0;
  }
  
  // Scraping job operations
  async getScrapingJobs(): Promise<ScrapingJob[]> {
    return await db.select().from(scrapingJobs).orderBy(desc(scrapingJobs.startTime));
  }

  async getScrapingJob(id: number): Promise<ScrapingJob | undefined> {
    const results = await db.select().from(scrapingJobs).where(eq(scrapingJobs.id, id));
    return results[0];
  }

  async createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob> {
    const results = await db.insert(scrapingJobs).values(job).returning();
    return results[0];
  }

  async updateScrapingJob(id: number, updateData: Partial<InsertScrapingJob>): Promise<ScrapingJob | undefined> {
    const results = await db.update(scrapingJobs)
      .set(updateData)
      .where(eq(scrapingJobs.id, id))
      .returning();
    return results[0];
  }
  
  // Region operations
  async getRegions(): Promise<Region[]> {
    return await db.select().from(regions);
  }

  async getRegion(id: number): Promise<Region | undefined> {
    const results = await db.select().from(regions).where(eq(regions.id, id));
    return results[0];
  }

  async createRegion(region: InsertRegion): Promise<Region> {
    const results = await db.insert(regions).values(region).returning();
    return results[0];
  }

  async updateRegion(id: number, updateData: Partial<InsertRegion>): Promise<Region | undefined> {
    const results = await db.update(regions)
      .set(updateData)
      .where(eq(regions.id, id))
      .returning();
    return results[0];
  }

  async deleteRegion(id: number): Promise<boolean> {
    const results = await db.delete(regions).where(eq(regions.id, id)).returning();
    return results.length > 0;
  }
  
  // Stats operations
  async getLeadStats(): Promise<LeadStats> {
    // Get total leads count
    const [totalLeadsResult] = await db.select({ count: count() }).from(leads);
    const totalLeads = Number(totalLeadsResult.count || 0);
    
    // Get today's new leads count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [newLeadsTodayResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(gte(leads.createdAt, today));
    const newLeadsToday = Number(newLeadsTodayResult.count || 0);
    
    // Get email validation stats
    const [validatedEmailsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.emailStatus, 'validated'));
    const validatedEmails = Number(validatedEmailsResult.count || 0);
    
    const [pendingValidationResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.emailStatus, 'pending'));
    const pendingValidation = Number(pendingValidationResult.count || 0);
    
    const [failedValidationResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.emailStatus, 'failed'));
    const failedValidation = Number(failedValidationResult.count || 0);
    
    // Get active regions count
    const [activeRegionsResult] = await db
      .select({ count: count() })
      .from(regions)
      .where(eq(regions.isActive, true));
    const activeRegions = Number(activeRegionsResult.count || 0);
    
    // Get last scan date from the most recent scraping job
    const lastScanJobs = await db
      .select()
      .from(scrapingJobs)
      .orderBy(desc(scrapingJobs.startTime))
      .limit(1);
    
    const lastScanDate = lastScanJobs.length > 0 ? lastScanJobs[0].startTime : undefined;
    
    return {
      totalLeads,
      newLeadsToday,
      validatedEmails,
      pendingValidation,
      failedValidation,
      activeRegions,
      lastScanDate
    };
  }
  
  // Helper methods
  private parseCompanySize(size: string): [number, number] {
    switch (size) {
      case '1-10': return [1, 10];
      case '11-50': return [11, 50];
      case '51-200': return [51, 200];
      case '201-500': return [201, 500];
      case '501+': return [501, -1]; // -1 means no upper limit
      default: return [0, -1];
    }
  }
  
  private getDateRange(range: string): { start: Date, end: Date } {
    const end = new Date();
    let start = new Date();
    
    switch (range) {
      case 'last-7':
        start.setDate(end.getDate() - 7);
        break;
      case 'last-30':
        start.setDate(end.getDate() - 30);
        break;
      case 'last-90':
        start.setDate(end.getDate() - 90);
        break;
      default:
        // Default to all time
        start = new Date(0);
    }
    
    return { start, end };
  }
}

// Create an instance of the database storage
export const dbStorage = new DbStorage();