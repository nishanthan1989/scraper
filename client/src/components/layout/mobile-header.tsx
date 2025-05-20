import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  onSidebarOpen: () => void;
}

export function MobileHeader({ onSidebarOpen }: MobileHeaderProps) {
  return (
    <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between shadow-sm bg-white">
      <Button 
        variant="ghost"
        size="icon"
        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
        onClick={onSidebarOpen}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </Button>
      <div className="flex-1 flex justify-center">
        <h1 className="text-xl font-bold text-primary-800">LeadScraper</h1>
      </div>
      <div className="pr-4">
        <img
          className="inline-block h-8 w-8 rounded-full"
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt="Profile picture"
        />
      </div>
    </div>
  );
}
