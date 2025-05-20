import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema - keeping the original schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Lead schema for office cleaning business
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  contactName: text("contact_name"),
  contactTitle: text("contact_title"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  moveDate: timestamp("move_date"),
  employeeCount: integer("employee_count"),
  officeSize: text("office_size"),
  emailStatus: text("email_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  scrapedFrom: text("scraped_from"),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Scraping source schema
export const scrapingSources = pgTable("scraping_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  selectors: jsonb("selectors").notNull(),
  requiresAuthentication: boolean("requires_authentication").default(false),
  credentials: jsonb("credentials"),
  lastScraped: timestamp("last_scraped"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScrapingSourceSchema = createInsertSchema(scrapingSources).omit({
  id: true,
  createdAt: true,
});

export type InsertScrapingSource = z.infer<typeof insertScrapingSourceSchema>;
export type ScrapingSource = typeof scrapingSources.$inferSelect;

// Scraping job schema
export const scrapingJobs = pgTable("scraping_jobs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  status: text("status").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  leadsFound: integer("leads_found"),
  leadsAdded: integer("leads_added"),
  error: text("error"),
});

export const insertScrapingJobSchema = createInsertSchema(scrapingJobs).omit({
  id: true,
});

export type InsertScrapingJob = z.infer<typeof insertScrapingJobSchema>;
export type ScrapingJob = typeof scrapingJobs.$inferSelect;

// Region schema
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
});

export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;
