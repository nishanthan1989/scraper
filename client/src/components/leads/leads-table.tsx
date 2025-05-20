import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, getInitials } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Lead } from "@shared/schema";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  totalLeads: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDeleteLead?: (id: number) => void;
}

export function LeadsTable({
  leads,
  isLoading,
  totalLeads,
  currentPage,
  pageSize,
  onPageChange,
  onDeleteLead
}: LeadsTableProps) {
  return (
    <div className="flex flex-col">
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
                {isLoading ? (
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
                  leads.map((lead) => (
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
                        {onDeleteLead && (
                          <button
                            type="button"
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            onClick={() => onDeleteLead(lead.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-4 shadow rounded-lg">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button 
            variant="outline" 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button 
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={leads.length < pageSize}
          >
            Next
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{leads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{" "}
              <span className="font-medium">{(currentPage - 1) * pageSize + leads.length}</span> of{" "}
              <span className="font-medium">{totalLeads}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <Button
                variant="outline"
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              {/* Calculate page numbers to display */}
              {Array.from({ length: Math.min(5, Math.ceil(totalLeads / pageSize)) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20"
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={() => onPageChange(currentPage + 1)}
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
  );
}
