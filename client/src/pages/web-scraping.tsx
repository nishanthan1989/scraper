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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TableProperties, Globe, Play, Clock, Settings, AlertCircle, CheckCircle, 
  Pause, PlayCircle, XCircle, AlertTriangle
} from "lucide-react";
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
  
  // Fetch active scraping jobs with progress information
  const { data: activeJobs, isLoading: activeJobsLoading } = useQuery({
    queryKey: ["/api/scraping-jobs/active"],
    refetchInterval: 2000, // Poll every 2 seconds to update progress
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
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs/active"] });
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
  
  // Pause scraping job
  const pauseScrapingMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/scraping-jobs/${jobId}/pause`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to pause scraping job");
      }
      
      return response.json();
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs/active"] });
      toast({
        title: "Job Paused",
        description: `Scraping job #${jobId} has been paused`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to pause job: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Resume scraping job
  const resumeScrapingMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/scraping-jobs/${jobId}/resume`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to resume scraping job");
      }
      
      return response.json();
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs/active"] });
      toast({
        title: "Job Resumed",
        description: `Scraping job #${jobId} has been resumed`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to resume job: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Cancel scraping job
  const cancelScrapingMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/scraping-jobs/${jobId}/cancel`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to cancel scraping job");
      }
      
      return response.json();
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs/active"] });
      toast({
        title: "Job Cancelled",
        description: `Scraping job #${jobId} has been cancelled`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cancel job: ${error.message}`,
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
  
  const pauseScrapingJob = (jobId: number) => {
    pauseScrapingMutation.mutate(jobId);
  };
  
  const resumeScrapingJob = (jobId: number) => {
    resumeScrapingMutation.mutate(jobId);
  };
  
  const cancelScrapingJob = (jobId: number) => {
    cancelScrapingMutation.mutate(jobId);
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
            <div className="space-y-6">
              {/* Active Jobs Section */}
              <div>
                <h3 className="text-lg font-medium mb-3">Active Scraping Jobs</h3>
                {activeJobsLoading ? (
                  <p>Loading active jobs...</p>
                ) : !activeJobs || activeJobs.length === 0 ? (
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Active Jobs</AlertTitle>
                    <AlertDescription>
                      There are no scraping jobs currently running. Start a new job from the Scraping Sources tab.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4 mb-6">
                    {activeJobs.map((activeJob: any) => {
                      const source = sources?.find((s: ScrapingSource) => s.id === activeJob.sourceId);
                      return (
                        <Card key={activeJob.jobId} className="border-blue-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                              <span>
                                Job #{activeJob.jobId} - {source?.name || `Source #${activeJob.sourceId}`}
                              </span>
                              <div>
                                {activeJob.status === "running" && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                                    Running
                                  </span>
                                )}
                                {activeJob.status === "paused" && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    <Pause className="h-3 w-3 mr-1" />
                                    Paused
                                  </span>
                                )}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-4">
                              <div className="flex justify-between mb-1 text-sm">
                                <span>Progress</span>
                                <span>{activeJob.progress}%</span>
                              </div>
                              <Progress value={activeJob.progress} className="h-2" />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              {activeJob.status === "running" && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => pauseScrapingJob(activeJob.jobId)}
                                  disabled={pauseScrapingMutation.isPending}
                                >
                                  <Pause className="h-4 w-4 mr-1" />
                                  Pause
                                </Button>
                              )}
                              {activeJob.status === "paused" && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => resumeScrapingJob(activeJob.jobId)}
                                  disabled={resumeScrapingMutation.isPending}
                                >
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Resume
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => cancelScrapingJob(activeJob.jobId)}
                                disabled={cancelScrapingMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Job History Section */}
              <div>
                <h3 className="text-lg font-medium mb-3">Job History</h3>
                {jobsLoading ? (
                  <p>Loading job history...</p>
                ) : !jobs || jobs.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Job History</AlertTitle>
                    <AlertDescription>
                      No scraping jobs have been run yet. Start a scraping job from the Scraping Sources tab.
                    </AlertDescription>
                  </Alert>
                ) : (
                  jobs.map((job: ScrapingJob) => {
                    const source = sources?.find((s: ScrapingSource) => s.id === job.sourceId);
                    // Skip jobs that are currently active (they're shown in the active section)
                    if (activeJobs?.some((aj: any) => aj.jobId === job.id)) {
                      return null;
                    }
                    return (
                      <Card key={job.id} className={job.status === "completed" ? "border-green-200" : job.status === "failed" ? "border-red-200" : ""}>
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
                              {job.status === "failed" && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Failed
                                </span>
                              )}
                              {job.status === "cancelled" && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Cancelled
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
