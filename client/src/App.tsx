import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/hooks/use-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LeadManagement from "@/pages/lead-management";
import WebScraping from "@/pages/web-scraping";
import Campaigns from "@/pages/campaigns";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import LeadDetails from "@/pages/lead-details";
import AppLayout from "@/components/layout/app-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leads" component={LeadManagement} />
      <Route path="/leads/:id" component={LeadDetails} />
      <Route path="/scraping" component={WebScraping} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <AppLayout>
            <Router />
          </AppLayout>
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
