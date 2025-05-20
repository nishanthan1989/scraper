import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Trash, Plus } from "lucide-react";
import type { Region } from "@shared/schema";

// Region form schema
const regionSchema = z.object({
  name: z.string().min(1, "Region name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  isActive: z.boolean().default(true),
});

type RegionFormValues = z.infer<typeof regionSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("regions");
  const [editingRegionId, setEditingRegionId] = useState<number | null>(null);

  // Fetch regions
  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ["/api/regions"],
  });

  // Region form
  const form = useForm<RegionFormValues>({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      name: "",
      city: "",
      state: "",
      isActive: true,
    },
  });

  // Create/Update region mutation
  const regionMutation = useMutation({
    mutationFn: async (values: RegionFormValues) => {
      if (editingRegionId === null) {
        // Create
        return apiRequest("POST", "/api/regions", values);
      } else {
        // Update
        return apiRequest("PATCH", `/api/regions/${editingRegionId}`, values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      toast({
        title: editingRegionId === null ? "Region Created" : "Region Updated",
        description: `The region has been successfully ${editingRegionId === null ? "created" : "updated"}`,
        variant: "default",
      });
      
      // Reset form and editing state
      form.reset({
        name: "",
        city: "",
        state: "",
        isActive: true,
      });
      setEditingRegionId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingRegionId === null ? "create" : "update"} region: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete region mutation
  const deleteRegionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/regions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      toast({
        title: "Region Deleted",
        description: "The region has been successfully deleted",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete region: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: RegionFormValues) => {
    regionMutation.mutate(values);
  };

  const handleEditRegion = (region: Region) => {
    setEditingRegionId(region.id);
    form.reset({
      name: region.name,
      city: region.city,
      state: region.state,
      isActive: region.isActive,
    });
  };

  const handleDeleteRegion = (id: number) => {
    if (window.confirm("Are you sure you want to delete this region?")) {
      deleteRegionMutation.mutate(id);
      
      // If the deleted region was being edited, reset the form
      if (id === editingRegionId) {
        form.reset({
          name: "",
          city: "",
          state: "",
          isActive: true,
        });
        setEditingRegionId(null);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingRegionId(null);
    form.reset({
      name: "",
      city: "",
      state: "",
      isActive: true,
    });
  };

  return (
    <>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-screen-2xl lg:mx-auto lg:px-8">
          <div className="py-6">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure your application settings and preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="regions">Regions</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Regions tab */}
          <TabsContent value="regions">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Regions list */}
              <Card>
                <CardHeader>
                  <CardTitle>Regions</CardTitle>
                  <CardDescription>
                    Manage the geographical regions you are targeting for lead collection.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {regionsLoading ? (
                    <div className="text-center py-4">Loading regions...</div>
                  ) : !regions || regions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No regions have been added yet. Add a region to get started.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {regions.map((region: Region) => (
                        <div 
                          key={region.id} 
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div>
                            <div className="font-medium">
                              {region.name}
                              {region.isActive ? (
                                <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="ml-2">Inactive</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {region.city}, {region.state}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditRegion(region)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => handleDeleteRegion(region.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add/Edit region form */}
              <Card>
                <CardHeader>
                  <CardTitle>{editingRegionId === null ? "Add New Region" : "Edit Region"}</CardTitle>
                  <CardDescription>
                    {editingRegionId === null 
                      ? "Add a new geographical region to target for lead collection." 
                      : "Edit the selected region details."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region Name</FormLabel>
                            <FormControl>
                              <Input placeholder="New York Metropolitan Area" {...field} />
                            </FormControl>
                            <FormDescription>
                              A descriptive name for the geographical area
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York City" {...field} />
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
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Active Status</FormLabel>
                              <FormDescription>
                                Mark this region as active to include it in scraping operations
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        {editingRegionId !== null && (
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        )}
                        <Button type="submit" disabled={regionMutation.isPending}>
                          {regionMutation.isPending 
                            ? "Saving..." 
                            : editingRegionId === null ? "Add Region" : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder tabs for future functionality */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Account settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the application's appearance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Appearance settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure your notification preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Notification settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
