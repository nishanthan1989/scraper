import type { InsertLead, ScrapingSource } from '@shared/schema';
import { dbStorage as storage } from './db-storage';

// Interface for scraped data
export interface ScrapedData {
  companyName: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  moveDate?: Date;
  employeeCount?: number;
  officeSize?: string;
}

// Simple demo scraper for generating sample data
export class Scraper {
  // Generate and save demo leads when a scrape is requested
  async scrapeSource(source: ScrapingSource): Promise<number> {
    try {
      // Create a new scraping job record
      const job = await storage.createScrapingJob({
        sourceId: source.id,
        status: 'running',
        startTime: new Date(),
        leadsFound: 0,
        leadsAdded: 0,
        error: null
      });
      
      console.log(`Starting demo scrape for source: ${source.name}`);
      
      // Generate demo data
      const demoLeads = this.generateDemoLeads(source);
      
      // Save the generated leads
      let savedCount = 0;
      for (const lead of demoLeads) {
        try {
          // Create the lead
          const insertLead: InsertLead = {
            ...lead,
            emailStatus: lead.contactEmail ? 'pending' : 'failed',
            scrapedFrom: source.url
          };
          
          await storage.createLead(insertLead);
          savedCount++;
        } catch (error) {
          console.error('Error saving lead:', error);
        }
      }
      
      // Update job with results
      await storage.updateScrapingJob(job.id, {
        status: 'completed',
        endTime: new Date(),
        leadsFound: demoLeads.length,
        leadsAdded: savedCount
      });
      
      // Update source with last scraped time
      await storage.updateScrapingSource(source.id, {
        lastScraped: new Date()
      });
      
      return savedCount;
    } catch (error) {
      console.error('Scraping error:', error);
      return 0;
    }
  }
  
  // Generate demo leads with randomized data
  private generateDemoLeads(source: ScrapingSource): ScrapedData[] {
    const companyNames = [
      'TechVision Corp', 'Horizon Industries', 'Innovative Solutions', 
      'Modern Workspaces', 'Bright Future Ltd', 'NextGen Office',
      'Global Enterprises', 'Urban Dynamics', 'Central Systems',
      'Peak Performance Inc', 'Metropolitan Services', 'Advance Technology'
    ];
    
    const industries = [
      'Technology', 'Finance', 'Healthcare', 'Legal Services',
      'Real Estate', 'Marketing', 'Education', 'Consulting',
      'Manufacturing', 'Retail', 'Media', 'Transportation'
    ];
    
    const cities = [
      'New York', 'San Francisco', 'Chicago', 'Los Angeles',
      'Boston', 'Seattle', 'Austin', 'Denver', 
      'Atlanta', 'Miami', 'Washington DC', 'Philadelphia'
    ];
    
    const states = [
      'NY', 'CA', 'IL', 'CA', 
      'MA', 'WA', 'TX', 'CO',
      'GA', 'FL', 'DC', 'PA'
    ];
    
    const leads: ScrapedData[] = [];
    
    // Generate between 5-15 random leads
    const count = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * companyNames.length);
      const moveDate = new Date();
      moveDate.setDate(moveDate.getDate() - Math.floor(Math.random() * 30));
      
      leads.push({
        companyName: companyNames[randomIndex],
        industry: industries[randomIndex],
        address: `${Math.floor(Math.random() * 999) + 1} Main St`,
        city: cities[randomIndex],
        state: states[randomIndex],
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        contactName: `John Smith`,
        contactTitle: 'Office Manager',
        contactEmail: `contact@${companyNames[randomIndex].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        contactPhone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        website: `https://www.${companyNames[randomIndex].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        moveDate,
        employeeCount: Math.floor(Math.random() * 500) + 10,
        officeSize: `${Math.floor(Math.random() * 10000) + 1000} sq ft`
      });
    }
    
    return leads;
  }
}

export const scraper = new Scraper();
