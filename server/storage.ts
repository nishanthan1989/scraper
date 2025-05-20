import { 
  users, 
  type User, 
  type InsertUser, 
  leads, 
  type Lead, 
  type InsertLead,
  scrapingSources,
  type ScrapingSource,
  type InsertScrapingSource,
  scrapingJobs,
  type ScrapingJob,
  type InsertScrapingJob,
  regions,
  type Region,
  type InsertRegion
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Lead operations
  getLeads(filters?: LeadFilters): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  
  // Scraping source operations
  getScrapingSources(): Promise<ScrapingSource[]>;
  getScrapingSource(id: number): Promise<ScrapingSource | undefined>;
  createScrapingSource(source: InsertScrapingSource): Promise<ScrapingSource>;
  updateScrapingSource(id: number, source: Partial<InsertScrapingSource>): Promise<ScrapingSource | undefined>;
  deleteScrapingSource(id: number): Promise<boolean>;
  
  // Scraping job operations
  getScrapingJobs(): Promise<ScrapingJob[]>;
  getScrapingJob(id: number): Promise<ScrapingJob | undefined>;
  createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob>;
  updateScrapingJob(id: number, job: Partial<InsertScrapingJob>): Promise<ScrapingJob | undefined>;
  
  // Region operations
  getRegions(): Promise<Region[]>;
  getRegion(id: number): Promise<Region | undefined>;
  createRegion(region: InsertRegion): Promise<Region>;
  updateRegion(id: number, region: Partial<InsertRegion>): Promise<Region | undefined>;
  deleteRegion(id: number): Promise<boolean>;
  
  // Stats operations
  getLeadStats(): Promise<LeadStats>;
}

// Types for filtering and statistics
export interface LeadFilters {
  location?: string;
  companySize?: string;
  moveDate?: string;
  emailStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LeadStats {
  totalLeads: number;
  newLeadsToday: number;
  validatedEmails: number;
  pendingValidation: number;
  failedValidation: number;
  activeRegions: number;
  lastScanDate?: Date;
}

// Memory Storage Implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  private scrapingSources: Map<number, ScrapingSource>;
  private scrapingJobs: Map<number, ScrapingJob>;
  private regions: Map<number, Region>;
  
  private userCurrentId: number;
  private leadCurrentId: number;
  private scrapingSourceCurrentId: number;
  private scrapingJobCurrentId: number;
  private regionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.scrapingSources = new Map();
    this.scrapingJobs = new Map();
    this.regions = new Map();
    
    this.userCurrentId = 1;
    this.leadCurrentId = 1;
    this.scrapingSourceCurrentId = 1;
    this.scrapingJobCurrentId = 1;
    this.regionCurrentId = 1;
    
    // Add initial regions
    this.addSampleRegions();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Lead operations
  async getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
    let leads = Array.from(this.leads.values());
    
    // Apply filters
    if (filters.location) {
      leads = leads.filter(lead => 
        lead.city?.toLowerCase().includes(filters.location!.toLowerCase()) ||
        lead.state?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    
    if (filters.companySize) {
      const [min, max] = this.parseCompanySize(filters.companySize);
      leads = leads.filter(lead => {
        if (!lead.employeeCount) return false;
        return lead.employeeCount >= min && (max === -1 || lead.employeeCount <= max);
      });
    }
    
    if (filters.moveDate) {
      const dateRange = this.getDateRange(filters.moveDate);
      leads = leads.filter(lead => {
        if (!lead.moveDate) return false;
        const moveDate = new Date(lead.moveDate);
        return moveDate >= dateRange.start && moveDate <= dateRange.end;
      });
    }
    
    if (filters.emailStatus) {
      leads = leads.filter(lead => lead.emailStatus === filters.emailStatus);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      leads = leads.filter(lead => 
        lead.companyName.toLowerCase().includes(search) ||
        lead.contactName?.toLowerCase().includes(search) ||
        lead.contactEmail?.toLowerCase().includes(search) ||
        lead.industry?.toLowerCase().includes(search)
      );
    }
    
    // Sort by created date (newest first)
    leads.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Pagination
    if (filters.page && filters.limit) {
      const start = (filters.page - 1) * filters.limit;
      leads = leads.slice(start, start + filters.limit);
    }
    
    return leads;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.leadCurrentId++;
    const now = new Date();
    const lead: Lead = { 
      ...insertLead, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;
    
    const updatedLead: Lead = { 
      ...lead, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }
  
  // Scraping source operations
  async getScrapingSources(): Promise<ScrapingSource[]> {
    return Array.from(this.scrapingSources.values());
  }

  async getScrapingSource(id: number): Promise<ScrapingSource | undefined> {
    return this.scrapingSources.get(id);
  }

  async createScrapingSource(insertSource: InsertScrapingSource): Promise<ScrapingSource> {
    const id = this.scrapingSourceCurrentId++;
    const now = new Date();
    const source: ScrapingSource = { 
      ...insertSource, 
      id, 
      createdAt: now 
    };
    this.scrapingSources.set(id, source);
    return source;
  }

  async updateScrapingSource(id: number, updateData: Partial<InsertScrapingSource>): Promise<ScrapingSource | undefined> {
    const source = this.scrapingSources.get(id);
    if (!source) return undefined;
    
    const updatedSource: ScrapingSource = { 
      ...source, 
      ...updateData 
    };
    this.scrapingSources.set(id, updatedSource);
    return updatedSource;
  }

  async deleteScrapingSource(id: number): Promise<boolean> {
    return this.scrapingSources.delete(id);
  }
  
  // Scraping job operations
  async getScrapingJobs(): Promise<ScrapingJob[]> {
    return Array.from(this.scrapingJobs.values());
  }

  async getScrapingJob(id: number): Promise<ScrapingJob | undefined> {
    return this.scrapingJobs.get(id);
  }

  async createScrapingJob(insertJob: InsertScrapingJob): Promise<ScrapingJob> {
    const id = this.scrapingJobCurrentId++;
    const job: ScrapingJob = { 
      ...insertJob, 
      id
    };
    this.scrapingJobs.set(id, job);
    return job;
  }

  async updateScrapingJob(id: number, updateData: Partial<InsertScrapingJob>): Promise<ScrapingJob | undefined> {
    const job = this.scrapingJobs.get(id);
    if (!job) return undefined;
    
    const updatedJob: ScrapingJob = { 
      ...job, 
      ...updateData 
    };
    this.scrapingJobs.set(id, updatedJob);
    return updatedJob;
  }
  
  // Region operations
  async getRegions(): Promise<Region[]> {
    return Array.from(this.regions.values());
  }

  async getRegion(id: number): Promise<Region | undefined> {
    return this.regions.get(id);
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const id = this.regionCurrentId++;
    const region: Region = { 
      ...insertRegion, 
      id 
    };
    this.regions.set(id, region);
    return region;
  }

  async updateRegion(id: number, updateData: Partial<InsertRegion>): Promise<Region | undefined> {
    const region = this.regions.get(id);
    if (!region) return undefined;
    
    const updatedRegion: Region = { 
      ...region, 
      ...updateData 
    };
    this.regions.set(id, updatedRegion);
    return updatedRegion;
  }

  async deleteRegion(id: number): Promise<boolean> {
    return this.regions.delete(id);
  }
  
  // Stats operations
  async getLeadStats(): Promise<LeadStats> {
    const allLeads = Array.from(this.leads.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newLeadsToday = allLeads.filter(lead => {
      if (!lead.createdAt) return false;
      const createdDate = new Date(lead.createdAt);
      createdDate.setHours(0, 0, 0, 0);
      return createdDate.getTime() === today.getTime();
    }).length;
    
    const validatedEmails = allLeads.filter(lead => lead.emailStatus === 'validated').length;
    const pendingValidation = allLeads.filter(lead => lead.emailStatus === 'pending').length;
    const failedValidation = allLeads.filter(lead => lead.emailStatus === 'failed').length;
    
    const activeRegions = Array.from(this.regions.values()).filter(region => region.isActive).length;
    
    // Get last scan date from the most recent scraping job
    const scrapingJobs = Array.from(this.scrapingJobs.values());
    let lastScanDate: Date | undefined = undefined;
    
    if (scrapingJobs.length > 0) {
      const sortedJobs = scrapingJobs.sort((a, b) => {
        const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return dateB - dateA;
      });
      
      if (sortedJobs[0].startTime) {
        lastScanDate = new Date(sortedJobs[0].startTime);
      }
    }
    
    return {
      totalLeads: allLeads.length,
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
  
  private addSampleRegions() {
    this.createRegion({
      name: "New York Metropolitan Area",
      city: "New York City",
      state: "NY",
      isActive: true
    });
    
    this.createRegion({
      name: "Chicago Area",
      city: "Chicago",
      state: "IL",
      isActive: true
    });
    
    this.createRegion({
      name: "Bay Area",
      city: "San Francisco",
      state: "CA",
      isActive: true
    });
    
    this.createRegion({
      name: "Greater Los Angeles",
      city: "Los Angeles",
      state: "CA",
      isActive: true
    });
    
    this.createRegion({
      name: "Dallas-Fort Worth",
      city: "Dallas",
      state: "TX",
      isActive: false
    });
  }
}

export const storage = new MemStorage();
