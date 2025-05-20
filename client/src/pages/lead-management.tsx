import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Eye, FileDown, Plus } from "lucide-react";
import { LeadFilters, type LeadFilterValues } from "@/components/leads/lead-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import type { Lead } from "@shared/schema";

export default function LeadManagement() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<LeadFilterValues>({
    location: "",
    companySize: "",
    moveDate: "",
    status: "",
    search: ""
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch leads with filters
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: [
      "/api/leads", 
      { 
        location: filters.location, 
        companySize: filters.companySize, 
        moveDate: filters.moveDate, 
        emailStatus: filters.status, 
        search: filters.search,
        page,
        limit: pageSize
      }
    ],
  });

  // Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Lead Deleted",
        description: "The lead has been successfully deleted",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete lead: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = async () => {
    try {
      // Directly trigger file download
      window.location.href = `/api/leads/export/csv?location=${filters.location}&companySize=${filters.companySize}&moveDate=${filters.moveDate}&emailStatus=${filters.status}&search=${filters.search}`;
      
      toast({
        title: "Export Started",
        description: "Your CSV file download has started",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export leads to CSV",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLead = (id: number) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFilterChange = (newFilters: LeadFilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const leads = leadsData || [];

  return (
    <>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-screen-2xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Lead Management
              </h2>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  Total Leads: <span className="font-medium ml-1">{statsLoading ? "..." : stats?.totalLeads}</span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  Last scan: <span className="font-medium ml-1">{statsLoading ? "..." : stats?.lastScanDate ? formatDateTime(stats.lastScanDate) : "Never"}</span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Eye className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  Validated emails: <span className="font-medium ml-1">{statsLoading ? "..." : stats?.validatedEmails}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <Button variant="outline" onClick={handleExportCSV}>
                <FileDown className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Export CSV
              </Button>
              <Button onClick={() => window.location.href = "/leads/new"}>
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Lead Database</h3>
            <p className="mt-2 text-sm text-gray-700">
              A list of all newly moved corporate offices with their contact information from your recent scraping operations.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4">
          <LeadFilters 
            onFilterChange={handleFilterChange} 
            initialValues={filters} 
          />
        </div>

        {/* Leads table */}
        <div className="mt-4">
          <LeadsTable
            leads={leads}
            isLoading={leadsLoading}
            totalLeads={stats?.totalLeads || 0}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onDeleteLead={handleDeleteLead}
          />
        </div>
      </div>
    </>
  );
}
