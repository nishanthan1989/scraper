import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportCard } from "./report-card";

export default function Reports() {
  // Fetch statistics for reports
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  return (
    <>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-screen-2xl lg:mx-auto lg:px-8">
          <div className="py-6">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Reports
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              View analytics and reports about your lead collection efforts.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scraping">Scraping Performance</TabsTrigger>
            <TabsTrigger value="regions">Regional Data</TabsTrigger>
            <TabsTrigger value="export">Export Reports</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <ReportCard 
                title="Total Leads" 
                value={statsLoading ? "..." : stats?.totalLeads || 0}
                description="Total number of leads collected"
                chart={<LeadGrowthChart />}
              />
              
              <ReportCard 
                title="Email Status" 
                value={statsLoading ? "..." : `${stats?.validatedEmails || 0} Validated`}
                description="Breakdown of email validation status"
                chart={<EmailStatusChart 
                  validated={stats?.validatedEmails || 0} 
                  pending={stats?.pendingValidation || 0} 
                  failed={stats?.failedValidation || 0} 
                />}
              />
              
              <ReportCard 
                title="Active Regions" 
                value={statsLoading ? "..." : stats?.activeRegions || 0}
                description="Number of active target regions"
                chart={<RegionsChart activeRegions={stats?.activeRegions || 0} />}
              />
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Lead Acquisition Over Time</CardTitle>
                <CardDescription>
                  Trend of new leads collected over the past months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeadTimelineChart />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholder tabs for future functionality */}
          <TabsContent value="scraping">
            <Card>
              <CardHeader>
                <CardTitle>Scraping Performance</CardTitle>
                <CardDescription>
                  Detailed analytics about your web scraping operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Scraping performance reports coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions">
            <Card>
              <CardHeader>
                <CardTitle>Regional Data Analysis</CardTitle>
                <CardDescription>
                  Breakdown of lead collection by geographical region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Regional data analysis coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>
                  Generate and download custom reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Export functionality coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Using ReportCard component imported from ./report-card.tsx

// Sample chart components (using SVG for simplicity)
function LeadGrowthChart() {
  return (
    <svg className="w-full h-40" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg">
      {/* Sample chart - would use a real chart library in production */}
      <path 
        d="M0,100 L30,90 L60,85 L90,80 L120,70 L150,65 L180,50 L210,40 L240,30 L270,10 L300,0" 
        fill="none" 
        stroke="#3B82F6" 
        strokeWidth="2" 
      />
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
      </linearGradient>
      <path 
        d="M0,100 L30,90 L60,85 L90,80 L120,70 L150,65 L180,50 L210,40 L240,30 L270,10 L300,0 L300,100 L0,100 Z" 
        fill="url(#grad)" 
      />
    </svg>
  );
}

function EmailStatusChart({ validated, pending, failed }: any) {
  const total = validated + pending + failed;
  const validatedPercentage = total > 0 ? (validated / total) * 100 : 0;
  const pendingPercentage = total > 0 ? (pending / total) * 100 : 0;
  const failedPercentage = total > 0 ? (failed / total) * 100 : 0;
  
  return (
    <svg className="w-full h-40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Sample donut chart */}
      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5e7eb" strokeWidth="15" />
      
      {/* Validated segment */}
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        fill="transparent" 
        stroke="#10B981" 
        strokeWidth="15" 
        strokeDasharray={`${validatedPercentage * 2.51} ${100 * 2.51 - validatedPercentage * 2.51}`}
        strokeDashoffset="0"
      />
      
      {/* Pending segment */}
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        fill="transparent" 
        stroke="#FBBF24" 
        strokeWidth="15" 
        strokeDasharray={`${pendingPercentage * 2.51} ${100 * 2.51 - pendingPercentage * 2.51}`}
        strokeDashoffset={`${-validatedPercentage * 2.51}`}
      />
      
      {/* Failed segment */}
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        fill="transparent" 
        stroke="#EF4444" 
        strokeWidth="15" 
        strokeDasharray={`${failedPercentage * 2.51} ${100 * 2.51 - failedPercentage * 2.51}`}
        strokeDashoffset={`${-(validatedPercentage + pendingPercentage) * 2.51}`}
      />
      
      <text x="50" y="45" fontSize="10" textAnchor="middle" fill="#6B7280">Email</text>
      <text x="50" y="58" fontSize="10" textAnchor="middle" fill="#6B7280">Status</text>
    </svg>
  );
}

function RegionsChart({ activeRegions }: any) {
  return (
    <svg className="w-full h-40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Sample bar chart */}
      <rect x="10" y="20" width="20" height="60" fill="#3B82F6" />
      <rect x="40" y="30" width="20" height="50" fill="#3B82F6" opacity="0.8" />
      <rect x="70" y="40" width="20" height="40" fill="#3B82F6" opacity="0.6" />
      
      <line x1="0" y1="80" x2="100" y2="80" stroke="#e5e7eb" strokeWidth="1" />
      
      <text x="20" y="95" fontSize="8" textAnchor="middle" fill="#6B7280">NYC</text>
      <text x="50" y="95" fontSize="8" textAnchor="middle" fill="#6B7280">CHI</text>
      <text x="80" y="95" fontSize="8" textAnchor="middle" fill="#6B7280">SF</text>
    </svg>
  );
}

function LeadTimelineChart() {
  return (
    <svg className="w-full h-60" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
      {/* Sample line chart for leads over time */}
      <path 
        d="M50,180 L100,160 L150,170 L200,150 L250,140 L300,120 L350,130 L400,100 L450,90 L500,70 L550,80 L600,50 L650,40 L700,30 L750,20" 
        fill="none" 
        stroke="#3B82F6" 
        strokeWidth="3" 
      />
      
      {/* Area fill under the line */}
      <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
      </linearGradient>
      <path 
        d="M50,180 L100,160 L150,170 L200,150 L250,140 L300,120 L350,130 L400,100 L450,90 L500,70 L550,80 L600,50 L650,40 L700,30 L750,20 L750,180 L50,180 Z" 
        fill="url(#grad2)" 
      />
      
      {/* X-axis */}
      <line x1="50" y1="180" x2="750" y2="180" stroke="#e5e7eb" strokeWidth="1" />
      
      {/* X-axis labels */}
      <text x="50" y="195" fontSize="10" textAnchor="middle" fill="#6B7280">Jan</text>
      <text x="150" y="195" fontSize="10" textAnchor="middle" fill="#6B7280">Feb</text>
      <text x="250" y="195" fontSize="10" textAnchor="middle" fill="#6B7280">Mar</text>
      <text x="350" y="195" fontSize="10" textAnchor="middle" fill="#6B7280">Apr</text>
      <text x="450" y="195" fontSize="10" textAnchor="middle" fill="#6B7280">May</text>
      <text x="550" y="195" fontSize="10" textAnchor="middle" fill="#6B7280">Jun</text>
      <text x="650" y="195" fontSize="10" textAnchor="middle" fill="#6B7280">Jul</text>
      <text x="750" y="195" fontSize="10" textAnchor="middle" fill="#6B7280">Aug</text>
      
      {/* Y-axis */}
      <line x1="50" y1="20" x2="50" y2="180" stroke="#e5e7eb" strokeWidth="1" />
      
      {/* Y-axis labels */}
      <text x="40" y="180" fontSize="10" textAnchor="end" fill="#6B7280">0</text>
      <text x="40" y="140" fontSize="10" textAnchor="end" fill="#6B7280">50</text>
      <text x="40" y="100" fontSize="10" textAnchor="end" fill="#6B7280">100</text>
      <text x="40" y="60" fontSize="10" textAnchor="end" fill="#6B7280">150</text>
      <text x="40" y="20" fontSize="10" textAnchor="end" fill="#6B7280">200</text>
    </svg>
  );
}
