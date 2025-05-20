import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface LeadFiltersProps {
  onFilterChange: (filters: LeadFilterValues) => void;
  initialValues?: LeadFilterValues;
}

export interface LeadFilterValues {
  location: string;
  companySize: string;
  moveDate: string;
  status: string;
  search: string;
}

export function LeadFilters({ onFilterChange, initialValues }: LeadFiltersProps) {
  const [location, setLocation] = useState(initialValues?.location || "");
  const [companySize, setCompanySize] = useState(initialValues?.companySize || "");
  const [moveDate, setMoveDate] = useState(initialValues?.moveDate || "");
  const [status, setStatus] = useState(initialValues?.status || "");
  const [search, setSearch] = useState(initialValues?.search || "");

  const handleClearFilters = () => {
    setLocation("");
    setCompanySize("");
    setMoveDate("");
    setStatus("");
    setSearch("");
    
    onFilterChange({
      location: "",
      companySize: "",
      moveDate: "",
      status: "",
      search: ""
    });
  };

  const handleApplyFilters = () => {
    onFilterChange({
      location,
      companySize,
      moveDate,
      status,
      search
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
        <Button onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
