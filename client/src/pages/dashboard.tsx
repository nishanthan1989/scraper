import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Eye, 
  FileDown, 
  Plus, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Lead } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch leads with filters
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: [
      "/api/leads", 
      { 
        location, 
        companySize, 
        moveDate, 
        emailStatus: status, 
        search: searchTerm,
        page,
        limit: pageSize
      }
    ],
  });

  const leads = leadsData || [];
  
  const handleExportCSV = async () => {
    try {
      // Directly trigger file download
      window.location.href = `/api/leads/export/csv?location=${location}&companySize=${companySize}&moveDate=${moveDate}&emailStatus=${status}&search=${searchTerm}`;
      
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

  const handleNewScrape = () => {
    // Navigate to scraping page
    window.location.href = "/scraping";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setLocation("");
    setCompanySize("");
    setMoveDate("");
    setStatus("");
    setPage(1);
  };

  const applyFilters = () => {
    setPage(1);
  };

  return (
    <>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-screen-2xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Lead Management Dashboard
              </h2>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  Active Regions: <span className="font-medium ml-1">{statsLoading ? "..." : stats?.activeRegions}</span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  Last scan: <span className="font-medium ml-1">{statsLoading ? "..." : stats?.lastScanDate ? formatDateTime(stats.lastScanDate) : "Never"}</span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Eye className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  Total leads: <span className="font-medium ml-1">{statsLoading ? "..." : stats?.totalLeads}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <Button variant="outline" onClick={handleExportCSV}>
                <FileDown className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Export CSV
              </Button>
              <Button onClick={handleNewScrape}>
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Scrape
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Overview</h3>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Stats cards */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <UserPlus className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">New Leads (Today)</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{statsLoading ? "..." : stats?.newLeadsToday}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="sr-only">Increased by</span>
                      12%
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Validated Emails</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{statsLoading ? "..." : stats?.validatedEmails}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="sr-only">Increased by</span>
                      8%
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Validation</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{statsLoading ? "..." : stats?.pendingValidation}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-yellow-600">
                      <MinusCircle className="self-center flex-shrink-0 h-5 w-5 text-yellow-500" />
                      <span className="sr-only">No change</span>
                      0%
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed Scrapes</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{statsLoading ? "..." : stats?.failedValidation}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="sr-only">Increased by</span>
                      5%
                    </div>
                  </dd>
                </div>
              </div>
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

        {/* Filter section */}
        <div className="mt-4 bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <select
                id="location"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">All Locations</option>
                <option value="new-york">New York City</option>
                <option value="chicago">Chicago</option>
                <option value="san-francisco">San Francisco</option>
                <option value="los-angeles">Los Angeles</option>
              </select>
            </div>
            <div>
              <label htmlFor="company-size" className="block text-sm font-medium text-gray-700">
                Company Size
              </label>
              <select
                id="company-size"
                name="company-size"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">All Sizes</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501+">501+ employees</option>
              </select>
            </div>
            <div>
              <label htmlFor="move-date" className="block text-sm font-medium text-gray-700">
                Move Date
              </label>
              <select
                id="move-date"
                name="move-date"
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">Any Time</option>
                <option value="last-7">Last 7 days</option>
                <option value="last-30">Last 30 days</option>
                <option value="last-90">Last 90 days</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="validated">Email Validated</option>
                <option value="pending">Pending Validation</option>
                <option value="failed">Failed Validation</option>
              </select>
            </div>
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Company name..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Leads table */}
        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <div className="shadow-sm ring-1 ring-black ring-opacity-5">
                <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
                      >
                        Company
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 z-10 hidden border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell"
                      >
                        Location
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 z-10 hidden border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                      >
                        Contact
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
                      >
                        Move Date
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 py-3.5 pr-4 pl-3 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {leadsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-sm text-gray-500 text-center">
                          Loading leads...
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-sm text-gray-500 text-center">
                          No leads found. Try adjusting your filters or add new leads.
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead: Lead) => (
                        <tr key={lead.id}>
                          <td className="whitespace-nowrap border-b border-gray-200 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                                <span className="font-bold">{getInitials(lead.companyName)}</span>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{lead.companyName}</div>
                                <div className="text-gray-500">{lead.industry || "Unknown"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap border-b border-gray-200 px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                            <div>{lead.city || "Unknown"}</div>
                            <div className="text-gray-400">{lead.address || "No address"}</div>
                          </td>
                          <td className="whitespace-nowrap border-b border-gray-200 px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                            <div>{lead.contactName || "Unknown"}</div>
                            <div className="text-gray-400">{lead.contactTitle || "No title"}</div>
                          </td>
                          <td className="whitespace-nowrap border-b border-gray-200 px-3 py-4 text-sm text-gray-500">
                            {lead.contactEmail ? (
                              <a href={`mailto:${lead.contactEmail}`} className="text-primary-600 hover:text-primary-900">
                                {lead.contactEmail}
                              </a>
                            ) : (
                              <span className="text-gray-400">No email</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap border-b border-gray-200 px-3 py-4 text-sm text-gray-500">
                            {lead.moveDate ? formatDate(lead.moveDate) : "Unknown"}
                          </td>
                          <td className="whitespace-nowrap border-b border-gray-200 px-3 py-4 text-sm">
                            <StatusBadge status={lead.emailStatus as "validated" | "pending" | "failed"} />
                          </td>
                          <td className="relative whitespace-nowrap border-b border-gray-200 py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6 lg:pr-8">
                            <Link href={`/leads/${lead.id}`} className="text-primary-600 hover:text-primary-900">
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              onClick={() => {
                                // Handle delete logic
                                toast({
                                  title: "Not Implemented",
                                  description: "Delete functionality is not implemented in this demo",
                                  variant: "default",
                                });
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-4 shadow rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button 
              variant="outline" 
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={leads.length < pageSize}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{leads.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{" "}
                <span className="font-medium">{(page - 1) * pageSize + leads.length}</span> of{" "}
                <span className="font-medium">{stats?.totalLeads || 0}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Button
                  variant="outline"
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                {/* Page buttons */}
                <Button
                  variant={page === 1 ? "default" : "outline"}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20"
                  onClick={() => setPage(1)}
                >
                  1
                </Button>
                
                {/* Additional page buttons would go here */}
                
                <Button
                  variant="outline"
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  onClick={() => setPage(page + 1)}
                  disabled={leads.length < pageSize}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Additional imports needed for the component
import { UserPlus, CheckCircle, Clock, MinusCircle, AlertTriangle, Search } from "lucide-react";
