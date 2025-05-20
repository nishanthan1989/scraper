import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Building, Mail, ArrowRight, Plus } from "lucide-react";

export default function Campaigns() {
  // This is a placeholder page for future campaign management functionality
  
  const mockCampaigns = [
    {
      id: 1,
      name: "New Office Welcome Package",
      status: "active",
      leads: 45,
      sent: 38,
      opened: 22,
      responded: 8,
      date: "2023-06-15"
    },
    {
      id: 2,
      name: "Summer Cleaning Special",
      status: "scheduled",
      leads: 120,
      sent: 0,
      opened: 0,
      responded: 0,
      date: "2023-07-01"
    },
    {
      id: 3,
      name: "Follow-up with Manhattan Offices",
      status: "draft",
      leads: 32,
      sent: 0,
      opened: 0,
      responded: 0,
      date: null
    },
    {
      id: 4,
      name: "End of Year Promotion",
      status: "completed",
      leads: 87,
      sent: 87,
      opened: 62,
      responded: 15,
      date: "2022-12-10"
    }
  ];

  return (
    <>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-screen-2xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Campaigns
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage email campaigns to reach out to your leads.
              </p>
            </div>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <Button>
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockCampaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <StatusBadge status={campaign.status} />
                </div>
                {campaign.date && (
                  <CardDescription className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(campaign.date)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      Leads
                    </div>
                    <span className="text-sm font-medium">{campaign.leads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      Sent
                    </div>
                    <span className="text-sm font-medium">{campaign.sent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Opened
                    </div>
                    <span className="text-sm font-medium">{campaign.opened}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Responded
                    </div>
                    <span className="text-sm font-medium">{campaign.responded}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 flex justify-end">
                <Button variant="outline" size="sm" className="text-primary-600">
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Campaign management functionality is under development.</p>
          <p>This page is a placeholder for upcoming features.</p>
        </div>
      </div>
    </>
  );
}

// Helper components
function StatusBadge({ status }: { status: string }) {
  let color = "";
  let label = "";
  
  switch (status) {
    case "active":
      color = "bg-green-100 text-green-800";
      label = "Active";
      break;
    case "scheduled":
      color = "bg-blue-100 text-blue-800";
      label = "Scheduled";
      break;
    case "draft":
      color = "bg-gray-100 text-gray-800";
      label = "Draft";
      break;
    case "completed":
      color = "bg-purple-100 text-purple-800";
      label = "Completed";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
      label = status;
  }
  
  return (
    <Badge className={`${color}`}>
      {label}
    </Badge>
  );
}

// Helper function
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}
