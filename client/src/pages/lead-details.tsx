import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Trash } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

// Create a schema for lead form validation
const leadFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
  moveDate: z.string().optional(),
  employeeCount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  officeSize: z.string().optional(),
  emailStatus: z.enum(["validated", "pending", "failed"]),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNewLead = id === "new";

  // Fetch lead data if editing an existing lead
  const { data: lead, isLoading } = useQuery({
    queryKey: [`/api/leads/${id}`],
    enabled: !isNewLead,
  });

  // Form setup
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      contactName: "",
      contactTitle: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      moveDate: "",
      employeeCount: undefined,
      officeSize: "",
      emailStatus: "pending",
      notes: "",
    },
  });

  // Update form values when lead data is loaded
  React.useEffect(() => {
    if (lead && !isLoading) {
      const formattedMoveDate = lead.moveDate 
        ? new Date(lead.moveDate).toISOString().split('T')[0]
        : "";

      form.reset({
        ...lead,
        moveDate: formattedMoveDate,
      });
    }
  }, [lead, isLoading, form]);

  // Save lead mutation
  const saveMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      if (isNewLead) {
        return apiRequest("POST", "/api/leads", values);
      } else {
        return apiRequest("PATCH", `/api/leads/${id}`, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: isNewLead ? "Lead Created" : "Lead Updated",
        description: `The lead has been successfully ${isNewLead ? "created" : "updated"}`,
        variant: "default",
      });
      
      navigate("/leads");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isNewLead ? "create" : "update"} lead: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Lead Deleted",
        description: "The lead has been successfully deleted",
        variant: "default",
      });
      
      navigate("/leads");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete lead: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: LeadFormValues) => {
    saveMutation.mutate(values);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-screen-2xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate("/leads")} className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {isNewLead ? "Add New Lead" : `Edit Lead: ${lead?.companyName || ""}`}
                </h2>
                {!isNewLead && lead?.createdAt && (
                  <p className="mt-1 text-sm text-gray-500">
                    Created on {formatDateTime(lead.createdAt)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              {!isNewLead && (
                <Button variant="outline" onClick={handleDelete} className="text-red-600">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Lead
                </Button>
              )}
              <Button type="submit" form="lead-form">
                <Save className="h-4 w-4 mr-2" />
                {isNewLead ? "Create Lead" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-10">Loading lead information...</div>
        ) : (
          <Form {...form}>
            <form id="lead-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input placeholder="Technology, Finance, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="employeeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="50" 
                              {...field}
                              value={field.value === undefined ? "" : field.value}
                              onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="moveDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Move Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="officeSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Size</FormLabel>
                          <FormControl>
                            <Input placeholder="5000 sq ft" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Office Manager" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="emailStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select email status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="validated">Validated</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes about this lead..." 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => navigate("/leads")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : isNewLead ? "Create Lead" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </>
  );
}

import * as React from "react";
