import type { InsertLead, ScrapingSource, ScrapingJob } from '@shared/schema';
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

// Track active scraping jobs
const activeJobs: Map<number, { 
  job: ScrapingJob, 
  progress: number, 
  status: 'running' | 'paused' | 'completed' | 'failed', 
  cancel: () => void 
}> = new Map();

// Scraper implementation for real websites
export class Scraper {
  // Check if a job is currently running for a source
  isScrapingRunning(sourceId: number): boolean {
    const jobInfo = Array.from(activeJobs.values()).find(info => 
      info.job.sourceId === sourceId && ['running', 'paused'].includes(info.status)
    );
    return !!jobInfo;
  }
  
  // Get all active scraping jobs
  getActiveJobs(): { sourceId: number, jobId: number, progress: number, status: string }[] {
    return Array.from(activeJobs.entries()).map(([jobId, info]) => ({
      sourceId: info.job.sourceId,
      jobId,
      progress: info.progress,
      status: info.status
    }));
  }
  
  // Pause a running scraping job
  async pauseScrapingJob(jobId: number): Promise<boolean> {
    const jobInfo = activeJobs.get(jobId);
    if (jobInfo && jobInfo.status === 'running') {
      jobInfo.status = 'paused';
      await storage.updateScrapingJob(jobId, {
        status: 'paused'
      });
      activeJobs.set(jobId, jobInfo);
      return true;
    }
    return false;
  }
  
  // Resume a paused scraping job
  async resumeScrapingJob(jobId: number): Promise<boolean> {
    const jobInfo = activeJobs.get(jobId);
    if (jobInfo && jobInfo.status === 'paused') {
      jobInfo.status = 'running';
      await storage.updateScrapingJob(jobId, {
        status: 'running'
      });
      activeJobs.set(jobId, jobInfo);
      return true;
    }
    return false;
  }
  
  // Cancel a running or paused scraping job
  async cancelScrapingJob(jobId: number): Promise<boolean> {
    const jobInfo = activeJobs.get(jobId);
    if (jobInfo) {
      if (typeof jobInfo.cancel === 'function') {
        jobInfo.cancel();
      }
      
      await storage.updateScrapingJob(jobId, {
        status: 'cancelled',
        endTime: new Date()
      });
      
      activeJobs.delete(jobId);
      return true;
    }
    return false;
  }
  
  async scrapeSource(source: ScrapingSource): Promise<number> {
    // Check if there's already an active job for this source
    if (this.isScrapingRunning(source.id)) {
      throw new Error(`A scraping job is already running for source #${source.id}`);
    }
    
    // Create a new scraping job record
    const job = await storage.createScrapingJob({
      sourceId: source.id,
      status: 'running',
      startTime: new Date(),
      leadsFound: 0,
      leadsAdded: 0,
      error: null
    });
    
    // Create a cancelable job
    let isCancelled = false;
    const cancelJob = () => { isCancelled = true; };
    
    // Add to active jobs
    activeJobs.set(job.id, {
      job,
      progress: 0,
      status: 'running',
      cancel: cancelJob
    });
    
    try {
      console.log(`Starting scrape for source: ${source.name}`);
      
      let scrapedLeads: ScrapedData[] = [];
      
      if (source.name.includes("Commercial Real Estate")) {
        // Use specialized scraping for Commercial Real Estate Australia
        scrapedLeads = await this.scrapeCommercialRealEstate(source.url, job.id);
      } else {
        // For other sources, use the CSS selectors provided in the source config
        scrapedLeads = await this.scrapeGenericWebsite(source, job.id);
      }
      
      if (isCancelled) {
        console.log(`Scraping job #${job.id} was cancelled`);
        return 0;
      }
      
      // Update progress to 50%
      this.updateJobProgress(job.id, 50);
      
      // Save the generated leads
      let savedCount = 0;
      for (let i = 0; i < scrapedLeads.length; i++) {
        if (isCancelled) break;
        
        try {
          const lead = scrapedLeads[i];
          
          // Create the lead
          const insertLead: InsertLead = {
            ...lead,
            emailStatus: lead.contactEmail ? 'pending' : 'failed',
            scrapedFrom: source.url
          };
          
          await storage.createLead(insertLead);
          savedCount++;
          
          // Update progress based on lead processing
          const newProgress = 50 + Math.floor((i / scrapedLeads.length) * 50);
          this.updateJobProgress(job.id, newProgress);
          
          // Check if we should pause
          const currentJobInfo = activeJobs.get(job.id);
          if (currentJobInfo && currentJobInfo.status === 'paused') {
            // Wait until resumed
            await this.waitForResume(job.id);
            
            // Check if cancelled during pause
            if (isCancelled) {
              break;
            }
          }
        } catch (error) {
          console.error('Error saving lead:', error);
        }
      }
      
      // If cancelled, don't update to completed
      if (isCancelled) {
        activeJobs.delete(job.id);
        return savedCount;
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
      
      // Remove from active jobs
      activeJobs.delete(job.id);
      
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
      
      // Remove from active jobs
      activeJobs.delete(job.id);
      
      return 0;
    }
  }
  
  // Helper method to update job progress
  private updateJobProgress(jobId: number, progress: number): void {
    const jobInfo = activeJobs.get(jobId);
    if (jobInfo) {
      jobInfo.progress = progress;
      activeJobs.set(jobId, jobInfo);
    }
  }
  
  // Helper method to wait for a paused job to resume
  private async waitForResume(jobId: number): Promise<void> {
    return new Promise((resolve) => {
      const checkStatus = () => {
        const jobInfo = activeJobs.get(jobId);
        if (!jobInfo || jobInfo.status === 'running' || jobInfo.status === 'completed' || jobInfo.status === 'failed') {
          resolve();
        } else {
          setTimeout(checkStatus, 1000); // Check again in 1 second
        }
      };
      
      checkStatus();
    });
  }
  
  // Generic scraper using source selectors
  private async scrapeGenericWebsite(source: ScrapingSource, jobId: number): Promise<ScrapedData[]> {
    try {
      console.log(`Scraping website: ${source.url}`);
      
      // Update progress to 10%
      this.updateJobProgress(jobId, 10);
      
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Update progress to 20%
      this.updateJobProgress(jobId, 20);
      
      const $ = cheerio.load(html);
      const leads: ScrapedData[] = [];
      
      // Get selectors from source config
      const selectors = source.selectors as any;
      if (!selectors || !selectors.leadContainer) {
        throw new Error('Invalid selectors configuration');
      }
      
      console.log(`Looking for lead containers with selector: ${selectors.leadContainer}`);
      const containers = $(selectors.leadContainer);
      console.log(`Found ${containers.length} potential lead containers`);
      
      // Update progress to 30%
      this.updateJobProgress(jobId, 30);
      
      // Find lead containers
      let processedCount = 0;
      containers.each((i, element) => {
        // Check if the job was cancelled or paused
        const jobInfo = activeJobs.get(jobId);
        if (!jobInfo || jobInfo.status === 'paused') {
          return false; // Stop iteration
        }
        
        try {
          // Extract data using the provided selectors
          const companyName = $(element).find(selectors.companyName).text().trim();
          
          // Skip if no company name found
          if (!companyName) {
            return;
          }
          
          console.log(`Found lead: ${companyName}`);
          
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
          
          // Update progress based on how many items we've processed
          processedCount++;
          const progress = 30 + Math.floor((processedCount / containers.length) * 20);
          this.updateJobProgress(jobId, Math.min(progress, 50));
          
        } catch (error) {
          console.error('Error processing listing:', error);
        }
      });
      
      if (leads.length === 0) {
        // Try a more generic approach if the specific selectors failed
        console.log('No leads found with specific selectors, trying generic approach');
        return await this.scrapeWithGenericSelectors(source.url, jobId);
      }
      
      return leads;
    } catch (error) {
      console.error('Error scraping website:', error);
      
      // Try a fallback approach with generic selectors
      try {
        console.log('Attempting fallback with generic selectors...');
        return await this.scrapeWithGenericSelectors(source.url, jobId);
      } catch (fallbackError) {
        console.error('Fallback scraping also failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }
  
  // Fallback scraper with generic selectors
  private async scrapeWithGenericSelectors(url: string, jobId: number): Promise<ScrapedData[]> {
    try {
      console.log(`Using generic selectors for: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const leads: ScrapedData[] = [];
      
      // Update progress
      this.updateJobProgress(jobId, 30);
      
      // Generic approach: Look for common business listing patterns
      const businessCards = $('div.card, div.listing, div.result, article, div.property, .row:has(h2, h3)');
      console.log(`Found ${businessCards.length} potential business cards with generic selectors`);
      
      if (businessCards.length === 0) {
        // Last resort: extract any structured data
        $('h2, h3').each((i, heading) => {
          const headingText = $(heading).text().trim();
          if (headingText && headingText.length > 3) {
            const company = {
              companyName: headingText,
              industry: undefined,
              address: $(heading).closest('div').find('address, .address, p:contains("Street")').text().trim() || undefined,
              city: undefined,
              state: undefined,
              zipCode: undefined,
              contactName: undefined,
              contactTitle: undefined,
              contactEmail: undefined,
              contactPhone: $(heading).closest('div').find('.phone, a[href^="tel:"]').text().trim() || undefined,
              moveDate: new Date(),
              website: undefined,
              employeeCount: undefined,
              officeSize: undefined
            };
            
            leads.push(company);
          }
        });
      }
      
      // Process each potential business card 
      businessCards.each((i, card) => {
        try {
          const title = $(card).find('h2, h3, .title, .name, .business-name').first().text().trim();
          if (!title) return; // Skip if no title found
          
          // Address detection
          const addressText = $(card).find('.address, address, p:contains("Street"), .location').text().trim();
          
          // Extract city/state from address if available
          let city = '';
          let state = '';
          let zipCode = '';
          
          if (addressText) {
            const addressParts = addressText.split(',');
            if (addressParts.length > 1) {
              city = addressParts[addressParts.length - 2]?.trim() || '';
              
              // Try to extract state and zip/postcode
              const lastPart = addressParts[addressParts.length - 1]?.trim() || '';
              const stateZipMatch = lastPart.match(/([A-Z]{2,3})\s+(\d{4,5})/);
              if (stateZipMatch) {
                state = stateZipMatch[1];
                zipCode = stateZipMatch[2];
              }
            }
          }
          
          // Contact info detection
          const phoneText = $(card).find('a[href^="tel:"], .phone, .tel, .contact').text().trim();
          
          // Create lead
          leads.push({
            companyName: title,
            industry: $(card).find('.category, .industry, .type').text().trim() || 'Business',
            address: addressText || undefined,
            city: city || undefined,
            state: state || undefined,
            zipCode: zipCode || undefined,
            contactName: $(card).find('.contact-name, .agent, .person').text().trim() || undefined,
            contactTitle: undefined,
            contactEmail: undefined,
            contactPhone: phoneText || undefined,
            moveDate: new Date(),
            website: undefined,
            employeeCount: undefined,
            officeSize: undefined
          });
        } catch (error) {
          console.error('Error processing generic listing:', error);
        }
      });
      
      // Update progress
      this.updateJobProgress(jobId, 50);
      
      if (leads.length === 0) {
        throw new Error('No lead data could be extracted using generic selectors');
      }
      
      return leads;
    } catch (error) {
      console.error('Error in generic scraping:', error);
      throw error;
    }
  }
  
  // Specialized scraper for Commercial Real Estate Australia
  private async scrapeCommercialRealEstate(baseUrl: string, jobId: number): Promise<ScrapedData[]> {
    try {
      console.log(`Scraping Commercial Real Estate site: ${baseUrl}`);
      
      // Update progress to 10%
      this.updateJobProgress(jobId, 10);
      
      // Fetch the main listing page
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Update progress to 20%
      this.updateJobProgress(jobId, 20);
      
      const $ = cheerio.load(html);
      const leads: ScrapedData[] = [];
      
      // Debug log the HTML structure to help with debugging
      console.log('Analyzing page structure...');
      
      // Find property listings - trying different selectors
      const selectors = [
        '.property-card',
        '.cards-wrapper > div',
        '.property-list',
        '.property-listing',
        '.property-result',
        '.property',
        '.listing-card',
        'article',
        '.card',
        '.result',
        '.PropertyCard'
      ];
      
      // Update progress to 30%
      this.updateJobProgress(jobId, 30);
      
      let propertyElements = null;
      let foundSelector = '';
      
      // Try each selector to find property listings
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          propertyElements = elements;
          foundSelector = selector;
          break;
        }
      }
      
      // If no elements found with our selectors, try a more generic approach
      if (!propertyElements || propertyElements.length === 0) {
        console.log('No property listings found with standard selectors, trying fallback selectors');
        
        // Find any div that might contain property listings
        propertyElements = $('div:has(h2, h3), article, .item, .listing');
        if (propertyElements.length > 0) {
          console.log(`Found ${propertyElements.length} potential property elements with fallback selector`);
        } else {
          // If we still can't find anything, look for any container with multiple child divs
          const containerCandidates = $('div > div').parent();
          containerCandidates.each((i, container) => {
            const children = $(container).children('div');
            if (children.length >= 3) {
              console.log(`Found potential container with ${children.length} child divs`);
              propertyElements = children;
              return false; // Break the loop
            }
          });
        }
      }
      
      if (!propertyElements || propertyElements.length === 0) {
        throw new Error('No property listings found on the page');
      }
      
      // Update progress to 40%
      this.updateJobProgress(jobId, 40);
      
      // Process each property listing
      let processedCount = 0;
      propertyElements.each((i, element) => {
        // Check if job should continue
        const jobInfo = activeJobs.get(jobId);
        if (!jobInfo || jobInfo.status === 'paused') {
          return false; // Stop iteration
        }
        
        try {
          // Try to extract using various possible selector combinations
          const title = $(element).find('h2, h3, .title, .heading').first().text().trim();
          if (!title && !foundSelector) {
            // Skip items that don't look like property listings
            return;
          }
          
          const address = $(element).find('.address, .location, .property-address, p:contains("Street")').first().text().trim();
          
          // Log what we found
          console.log(`Found listing: "${title || 'Unnamed property'}" at "${address || 'Unknown location'}"`);
          
          // Split address into components if possible
          let suburb = '';
          let state = '';
          let postcode = '';
          
          if (address) {
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
          }
          
          // Try to find agent details
          const agentName = $(element).find('.agent-name, .agent, .contact-name').first().text().trim();
          const agencyName = $(element).find('.agency-name, .agency, .company-name').first().text().trim();
          const phone = $(element).find('.phone, .tel, .contact-number, a[href^="tel:"]').first().text().trim();
          
          // Property details
          const propertyType = $(element).find('.property-type, .type, .category').first().text().trim();
          const propertySize = $(element).find('.property-size, .size, .area').first().text().trim();
          
          // Determine company name from available data
          const companyName = agencyName || title || `Property in ${suburb || 'Australia'}`;
          
          // Create a lead entry with the extracted data
          leads.push({
            companyName: companyName,
            industry: 'Real Estate',
            address: address || undefined,
            city: suburb || undefined,
            state: state || undefined,
            zipCode: postcode || undefined,
            contactName: agentName || 'Property Manager',
            contactTitle: 'Leasing Agent',
            contactEmail: undefined, // Email usually requires deeper scraping of individual listings
            contactPhone: phone || undefined,
            moveDate: new Date(), // Most recent listed date
            website: undefined,
            employeeCount: undefined,
            officeSize: propertySize || propertyType || undefined
          });
          
          // Update progress based on how many items we've processed
          processedCount++;
          const progress = 40 + Math.floor((processedCount / propertyElements.length) * 10);
          this.updateJobProgress(jobId, Math.min(progress, 50));
          
        } catch (error) {
          console.error('Error processing property listing:', error);
        }
      });
      
      // If no leads were found, make one last attempt to extract data
      if (leads.length === 0) {
        console.log('No lead data extracted with specific selectors, trying generic approach');
        
        // Look for any business names on the page
        $('h1, h2, h3, h4').each((i, heading) => {
          const headingText = $(heading).text().trim();
          if (headingText && headingText.length > 3 && !headingText.toLowerCase().includes('login') && !headingText.toLowerCase().includes('sign in')) {
            leads.push({
              companyName: headingText,
              industry: 'Real Estate',
              address: undefined,
              city: undefined,
              state: undefined,
              zipCode: undefined,
              contactName: undefined,
              contactTitle: undefined,
              contactEmail: undefined,
              contactPhone: undefined,
              moveDate: new Date(),
              website: undefined,
              employeeCount: undefined,
              officeSize: undefined
            });
          }
        });
      }
      
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
