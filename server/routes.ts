import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./scraper";
import { z } from "zod";
import { convertLeadsToCSV, validateEmail } from "./utils";
import { insertLeadSchema, insertRegionSchema, insertScrapingSourceSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // API routes
  router.get("/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getLeadStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Leads endpoints
  router.get("/leads", async (req: Request, res: Response) => {
    try {
      const { location, companySize, moveDate, emailStatus, search, page, limit } = req.query;
      
      const filters = {
        location: location as string | undefined,
        companySize: companySize as string | undefined,
        moveDate: moveDate as string | undefined,
        emailStatus: emailStatus as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };
      
      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  router.get("/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const lead = await storage.getLead(id);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  router.post("/leads", async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  router.patch("/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const validatedData = insertLeadSchema.partial().parse(req.body);
      
      const updatedLead = await storage.updateLead(id, validatedData);
      
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  router.delete("/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteLead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Export leads to CSV
  router.get("/leads/export/csv", async (req: Request, res: Response) => {
    try {
      const { location, companySize, moveDate, emailStatus, search } = req.query;
      
      const filters = {
        location: location as string | undefined,
        companySize: companySize as string | undefined,
        moveDate: moveDate as string | undefined,
        emailStatus: emailStatus as string | undefined,
        search: search as string | undefined
      };
      
      const leads = await storage.getLeads(filters);
      const csv = convertLeadsToCSV(leads);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting leads:", error);
      res.status(500).json({ message: "Failed to export leads" });
    }
  });

  // Regions endpoints
  router.get("/regions", async (req: Request, res: Response) => {
    try {
      const regions = await storage.getRegions();
      res.json(regions);
    } catch (error) {
      console.error("Error fetching regions:", error);
      res.status(500).json({ message: "Failed to fetch regions" });
    }
  });

  router.post("/regions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRegionSchema.parse(req.body);
      const region = await storage.createRegion(validatedData);
      res.status(201).json(region);
    } catch (error) {
      console.error("Error creating region:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create region" });
    }
  });

  router.patch("/regions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const validatedData = insertRegionSchema.partial().parse(req.body);
      
      const updatedRegion = await storage.updateRegion(id, validatedData);
      
      if (!updatedRegion) {
        return res.status(404).json({ message: "Region not found" });
      }
      
      res.json(updatedRegion);
    } catch (error) {
      console.error("Error updating region:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update region" });
    }
  });

  // Scraping sources endpoints
  router.get("/scraping-sources", async (req: Request, res: Response) => {
    try {
      const sources = await storage.getScrapingSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching scraping sources:", error);
      res.status(500).json({ message: "Failed to fetch scraping sources" });
    }
  });

  router.post("/scraping-sources", async (req: Request, res: Response) => {
    try {
      const validatedData = insertScrapingSourceSchema.parse(req.body);
      const source = await storage.createScrapingSource(validatedData);
      res.status(201).json(source);
    } catch (error) {
      console.error("Error creating scraping source:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create scraping source" });
    }
  });

  // Start scraping job
  router.post("/scrape/:sourceId", async (req: Request, res: Response) => {
    try {
      const sourceId = parseInt(req.params.sourceId, 10);
      const source = await storage.getScrapingSource(sourceId);
      
      if (!source) {
        return res.status(404).json({ message: "Scraping source not found" });
      }
      
      // Start scraping in the background
      scraper.scrapeSource(source)
        .then((leadsAdded) => {
          console.log(`Scraping completed: ${leadsAdded} leads added`);
        })
        .catch((error) => {
          console.error("Scraping error:", error);
        });
      
      res.status(202).json({ 
        message: "Scraping job started", 
        sourceId
      });
    } catch (error) {
      console.error("Error starting scraping job:", error);
      res.status(500).json({ message: "Failed to start scraping job" });
    }
  });

  // Validate email
  router.post("/validate-email", async (req: Request, res: Response) => {
    try {
      const { email, leadId } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const isValid = validateEmail(email);
      
      if (leadId) {
        const id = parseInt(leadId, 10);
        await storage.updateLead(id, { 
          contactEmail: email,
          emailStatus: isValid ? 'validated' : 'failed'
        });
      }
      
      res.json({ 
        email, 
        isValid
      });
    } catch (error) {
      console.error("Error validating email:", error);
      res.status(500).json({ message: "Failed to validate email" });
    }
  });

  // Register routes
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
