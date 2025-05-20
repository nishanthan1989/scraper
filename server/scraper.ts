import type { InsertLead, ScrapingSource } from '@shared/schema';
import { dbStorage as storage } from './db-storage';
import * as cheerio from 'cheerio';

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

// Scraper implementation for real websites
export class Scraper {
  async scrapeSource(source: ScrapingSource): Promise<number> {
    // Create a new scraping job record
    const job = await storage.createScrapingJob({
      sourceId: source.id,
      status: 'running',
      startTime: new Date(),
      leadsFound: 0,
      leadsAdded: 0,
      error: null
    });
    
    try {
      console.log(`Starting scrape for source: ${source.name}`);
      
      let scrapedLeads: ScrapedData[] = [];
      
      if (source.name.includes("Commercial Real Estate")) {
        // Use specialized scraping for Commercial Real Estate Australia
        scrapedLeads = await this.scrapeCommercialRealEstate(source.url);
      } else {
        // For other sources, use the CSS selectors provided in the source config
        scrapedLeads = await this.scrapeGenericWebsite(source);
      }
      
      // Save the generated leads
      let savedCount = 0;
      for (const lead of scrapedLeads) {
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
        leadsFound: scrapedLeads.length,
        leadsAdded: savedCount
      });
      
      // Update source with last scraped time
      await storage.updateScrapingSource(source.id, {
        lastScraped: new Date()
      });
      
      console.log(`Scraping completed: ${savedCount} leads added`);
      return savedCount;
    } catch (error) {
      console.error('Scraping error:', error);
      
      // Update job with error
      try {
        if (error instanceof Error) {
          await storage.updateScrapingJob(job.id, {
            status: 'failed',
            endTime: new Date(),
            error: error.message
          });
        }
      } catch (updateError) {
        console.error('Failed to update job status:', updateError);
      }
      
      return 0;
    }
  }
  
  // Generic scraper using source selectors
  private async scrapeGenericWebsite(source: ScrapingSource): Promise<ScrapedData[]> {
    try {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const leads: ScrapedData[] = [];
      
      // Get selectors from source config
      const selectors = source.selectors as any;
      if (!selectors || !selectors.leadContainer) {
        throw new Error('Invalid selectors configuration');
      }
      
      // Find lead containers
      $(selectors.leadContainer).each((i, element) => {
        try {
          // Extract data using the provided selectors
          const companyName = $(element).find(selectors.companyName).text().trim();
          
          // Skip if no company name found
          if (!companyName) {
            return;
          }
          
          const lead: ScrapedData = {
            companyName: companyName,
            industry: selectors.industry ? $(element).find(selectors.industry).text().trim() : undefined,
            address: selectors.address ? $(element).find(selectors.address).text().trim() : undefined,
            city: selectors.city ? $(element).find(selectors.city).text().trim() : undefined,
            state: selectors.state ? $(element).find(selectors.state).text().trim() : undefined,
            zipCode: selectors.zipCode ? $(element).find(selectors.zipCode).text().trim() : undefined,
            contactName: selectors.contactName ? $(element).find(selectors.contactName).text().trim() : undefined,
            contactEmail: selectors.contactEmail ? $(element).find(selectors.contactEmail).text().trim() : undefined,
            contactPhone: selectors.contactPhone ? $(element).find(selectors.contactPhone).text().trim() : undefined,
            moveDate: selectors.moveDate ? new Date($(element).find(selectors.moveDate).text().trim()) : new Date(),
            website: selectors.website ? $(element).find(selectors.website).text().trim() : undefined,
          };
          
          leads.push(lead);
        } catch (error) {
          console.error('Error processing listing:', error);
        }
      });
      
      if (leads.length === 0) {
        throw new Error('No leads found on the page');
      }
      
      return leads;
    } catch (error) {
      console.error('Error scraping website:', error);
      throw error;
    }
  }
  
  // Specialized scraper for Commercial Real Estate Australia
  private async scrapeCommercialRealEstate(baseUrl: string): Promise<ScrapedData[]> {
    try {
      // Fetch the main listing page
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const leads: ScrapedData[] = [];
      
      // Debug log the HTML structure to help with debugging
      console.log('Analyzing page structure...');
      
      // Find property listings - trying different selectors
      const selectors = [
        '.property-card',
        '.property-list',
        '.property-listing',
        '.property-result',
        '.property',
        '.listing-card',
        'article',
        '.card'
      ];
      
      let propertyElements: cheerio.Cheerio<cheerio.Element> = null;
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          propertyElements = elements;
          break;
        }
      }
      
      if (!propertyElements || propertyElements.length === 0) {
        throw new Error('No property listings found on the page');
      }
      
      // Process each property listing
      propertyElements.each((i: number, element: cheerio.Element) => {
        try {
          // Try to extract using various possible selector combinations
          const title = $(element).find('h2, h3, .title, .heading').first().text().trim();
          const address = $(element).find('.address, .location, .property-address').first().text().trim();
          
          // Split address into components if possible
          let suburb = '';
          let state = '';
          let postcode = '';
          
          const addressParts = address.split(',');
          if (addressParts.length > 1) {
            suburb = addressParts[addressParts.length - 2]?.trim() || '';
            
            // Try to extract state and postcode from the last part
            const lastPart = addressParts[addressParts.length - 1]?.trim() || '';
            const statePostcodeMatch = lastPart.match(/([A-Z]{2,3})\s+(\d{4})/);
            if (statePostcodeMatch) {
              state = statePostcodeMatch[1];
              postcode = statePostcodeMatch[2];
            }
          }
          
          // Try to find agent details
          const agentName = $(element).find('.agent-name, .agent, .contact-name').first().text().trim();
          const agencyName = $(element).find('.agency-name, .agency, .company-name').first().text().trim();
          const phone = $(element).find('.phone, .tel, .contact-number').first().text().trim();
          
          // Property details
          const propertyType = $(element).find('.property-type, .type, .category').first().text().trim();
          const propertySize = $(element).find('.property-size, .size, .area').first().text().trim();
          
          // Determine company name from available data
          const companyName = agencyName || title || `Property in ${suburb || 'Australia'}`;
          
          // Create a lead entry with the extracted data
          leads.push({
            companyName: companyName,
            industry: 'Real Estate',
            address: address,
            city: suburb,
            state: state,
            zipCode: postcode,
            contactName: agentName || 'Property Manager',
            contactTitle: 'Leasing Agent',
            contactEmail: undefined, // Email usually requires deeper scraping of individual listings
            contactPhone: phone || undefined,
            moveDate: new Date(), // Most recent listed date
            website: undefined,
            employeeCount: undefined,
            officeSize: propertySize || propertyType || undefined
          });
        } catch (error) {
          console.error('Error processing property listing:', error);
        }
      });
      
      if (leads.length === 0) {
        throw new Error('No lead data could be extracted from the page');
      }
      
      return leads;
    } catch (error) {
      console.error('Error scraping Commercial Real Estate:', error);
      throw error;
    }
  }
}

export const scraper = new Scraper();
