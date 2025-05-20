import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableProperties, Globe, Play, Clock, Settings, AlertCircle, CheckCircle } from "lucide-react";
import type { ScrapingSource, ScrapingJob } from "@shared/schema";

export default function WebScraping() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sources");
  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    selectors: {
      leadContainer: "",
      companyName: "",
      industry: "",
      address: "",
      city: "",
      state: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      moveDate: "",
    },
    requiresAuthentication: false,
    credentials: {
      username: "",
      password: "",
    },
    enabled: true,
  });
  
  // Predefined templates for common websites
  const templates = {
    commercialRealEstate: {
      name: "Commercial Real Estate Australia",
      url: "https://www.commercialrealestate.com.au/leased/vic/",
      selectors: {
        leadContainer: ".search-results__results .cards-wrapper > div",
        companyName: ".agent__details .agent__name",
        industry: "Real Estate",
        address: ".address-line",
        city: ".address-suburb",
        state: ".address-state",
        contactName: ".agent__details .agent__name",
        contactEmail: ".agent__contact-details .agent__email",
        contactPhone: ".agent__contact-details .agent__phone",
        moveDate: ".listing-details .listing-details__update-date",
      },
      requiresAuthentication: false,
      enabled: true,
    }
  };
  
  // Function to apply a template
  const applyTemplate = (templateName: keyof typeof templates) => {
    if (templates[templateName]) {
      setNewSource({...templates[templateName]});
      toast({
        title: "Template Applied",
        description: `Applied the ${templates[templateName].name} template. You can customize it further before adding.`,
        variant: "default",
      });
    }
  };

  // Fetch scraping sources
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/scraping-sources"],
  });

  // Fetch scraping jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/scraping-jobs"],
  });

  // Add new scraping source
  const addSourceMutation = useMutation({
    mutationFn: async (source: any) => {
      const response = await fetch("/api/scraping-sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(source),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add scraping source");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-sources"] });
      toast({
        title: "Source Added",
        description: "New scraping source has been added successfully",
        variant: "default",
      });
      // Reset form
      setNewSource({
        name: "",
        url: "",
        selectors: {
          leadContainer: "",
          companyName: "",
          industry: "",
          address: "",
          city: "",
          state: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          moveDate: "",
        },
        requiresAuthentication: false,
        credentials: {
          username: "",
          password: "",
        },
        enabled: true,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add source: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Start scraping job
  const startScrapingMutation = useMutation({
    mutationFn: async (sourceId: number) => {
      const response = await fetch(`/api/scrape/${sourceId}`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to start scraping job");
      }
      
      return response.json();
    },
    onSuccess: (_, sourceId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs"] });
      toast({
        title: "Scraping Started",
        description: `Scraping job for source #${sourceId} started successfully`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start scraping: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSourceMutation.mutate(newSource);
  };

  const startScraping = (sourceId: number) => {
    startScrapingMutation.mutate(sourceId);
  };

  return (
    <>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-screen-2xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Web Scraping
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure and manage web scraping sources to collect lead information about newly relocated corporate offices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="sources">
              <TableProperties className="h-4 w-4 mr-2" />
              Scraping Sources
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Clock className="h-4 w-4 mr-2" />
              Scraping Jobs
            </TabsTrigger>
            <TabsTrigger value="add">
              <Settings className="h-4 w-4 mr-2" />
              Add New Source
            </TabsTrigger>
          </TabsList>

          {/* Scraping Sources tab */}
          <TabsContent value="sources">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sourcesLoading ? (
                <p>Loading sources...</p>
              ) : !sources || sources.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Sources Found</AlertTitle>
                  <AlertDescription>
                    You haven't added any scraping sources yet. Add a new source to start collecting leads.
                  </AlertDescription>
                </Alert>
              ) : (
                sources.map((source: ScrapingSource) => (
                  <Card key={source.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{source.name}</span>
                        <Switch 
                          checked={source.enabled} 
                          disabled 
                        />
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center text-sm">
                          <Globe className="h-4 w-4 mr-1" />
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-[200px]"
                          >
                            {source.url}
                          </a>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Last scraped:</span>{" "}
                          {source.lastScraped ? formatDateTime(source.lastScraped) : "Never"}
                        </div>
                        <div>
                          <span className="font-medium">Authentication:</span>{" "}
                          {source.requiresAuthentication ? "Required" : "Not required"}
                        </div>
                        <div>
                          <span className="font-medium">Selectors configured:</span>{" "}
                          {Object.keys(source.selectors || {}).length}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => startScraping(source.id)}
                        disabled={startScrapingMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run Scraper
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Scraping Jobs tab */}
          <TabsContent value="jobs">
            <div className="space-y-4">
              {jobsLoading ? (
                <p>Loading jobs...</p>
              ) : !jobs || jobs.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Jobs Found</AlertTitle>
                  <AlertDescription>
                    No scraping jobs have been run yet. Start a scraping job from the Scraping Sources tab.
                  </AlertDescription>
                </Alert>
              ) : (
                jobs.map((job: ScrapingJob) => {
                  const source = sources?.find((s: ScrapingSource) => s.id === job.sourceId);
                  return (
                    <Card key={job.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>
                            Job #{job.id} - {source?.name || `Source #${job.sourceId}`}
                          </span>
                          <div>
                            {job.status === "completed" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            )}
                            {job.status === "running" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Clock className="h-3 w-3 mr-1 animate-spin" />
                                Running
                              </span>
                            )}
                            {job.status === "failed" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </div>
                        </CardTitle>
                        <CardDescription>
                          Started: {formatDateTime(job.startTime)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {job.endTime && (
                            <div>
                              <span className="font-medium">Completed:</span>{" "}
                              {formatDateTime(job.endTime)}
                            </div>
                          )}
                          {job.leadsFound !== undefined && (
                            <div>
                              <span className="font-medium">Leads found:</span>{" "}
                              {job.leadsFound}
                            </div>
                          )}
                          {job.leadsAdded !== undefined && (
                            <div>
                              <span className="font-medium">Leads added:</span>{" "}
                              {job.leadsAdded}
                            </div>
                          )}
                          {job.error && (
                            <div className="text-red-600">
                              <span className="font-medium">Error:</span> {job.error}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Add New Source tab */}
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add New Scraping Source</CardTitle>
                <CardDescription>
                  Configure a new website to scrape for lead information. Add selectors to extract specific data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-blue-50 rounded-md">
                  <h3 className="text-md font-medium mb-2">Quick Start Templates</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Use these pre-configured templates to get started quickly:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => applyTemplate('commercialRealEstate')}
                      type="button"
                    >
                      Commercial Real Estate Australia
                    </Button>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Source Name</Label>
                      <Input
                        id="name"
                        placeholder="E.g., Commercial Real Estate News"
                        value={newSource.name}
                        onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">Website URL</Label>
                      <Input
                        id="url"
                        placeholder="https://example.com/recent-moves"
                        value={newSource.url}
                        onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="requiresAuth"
                        checked={newSource.requiresAuthentication}
                        onCheckedChange={(checked) =>
                          setNewSource({ ...newSource, requiresAuthentication: checked })
                        }
                      />
                      <Label htmlFor="requiresAuth">Requires Authentication</Label>
                    </div>
                  </div>

                  {newSource.requiresAuthentication && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 pb-2 border rounded-md p-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          placeholder="Username"
                          value={newSource.credentials.username}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              credentials: {
                                ...newSource.credentials,
                                username: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Password"
                          value={newSource.credentials.password}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              credentials: {
                                ...newSource.credentials,
                                password: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>CSS Selectors</Label>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Selector Guide</AlertTitle>
                      <AlertDescription>
                        Use CSS selectors to extract data from the website. The leadContainer is the parent element that contains all information for a single lead.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div className="space-y-4 border rounded-md p-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadContainer">Lead Container</Label>
                      <Input
                        id="leadContainer"
                        placeholder=".listing-item, .company-card"
                        value={newSource.selectors.leadContainer}
                        onChange={(e) =>
                          setNewSource({
                            ...newSource,
                            selectors: {
                              ...newSource.selectors,
                              leadContainer: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          placeholder=".company-name, h2"
                          value={newSource.selectors.companyName}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                companyName: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          placeholder=".industry, .company-type"
                          value={newSource.selectors.industry}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                industry: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          placeholder=".address-line"
                          value={newSource.selectors.address}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                address: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder=".city"
                          value={newSource.selectors.city}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                city: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder=".state"
                          value={newSource.selectors.state}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                state: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Name</Label>
                        <Input
                          id="contactName"
                          placeholder=".contact-name"
                          value={newSource.selectors.contactName}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                contactName: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          placeholder=".email"
                          value={newSource.selectors.contactEmail}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                contactEmail: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          placeholder=".phone"
                          value={newSource.selectors.contactPhone}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                contactPhone: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="moveDate">Move Date</Label>
                        <Input
                          id="moveDate"
                          placeholder=".move-date, .relocation-date"
                          value={newSource.selectors.moveDate}
                          onChange={(e) =>
                            setNewSource({
                              ...newSource,
                              selectors: {
                                ...newSource.selectors,
                                moveDate: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any special instructions or notes about this source"
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit" disabled={addSourceMutation.isPending} className="w-full">
                    {addSourceMutation.isPending ? "Adding..." : "Add Scraping Source"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
