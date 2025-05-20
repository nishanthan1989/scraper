import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  UserPlus, 
  Search, 
  Calendar, 
  BarChart2, 
  Settings 
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      name: "Lead Management",
      href: "/leads",
      icon: UserPlus,
    },
    {
      name: "Web Scraping",
      href: "/scraping",
      icon: Search,
    },
    {
      name: "Campaigns",
      href: "/campaigns",
      icon: Calendar,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart2,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const classes = {
    active: "flex items-center px-2 py-2 text-sm font-medium rounded-md bg-primary-100 text-primary-800",
    inactive: "flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:flex md:flex-shrink-0"
      )}
    >
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-800">
          <h1 className="text-xl font-bold text-white">LeadScraper</h1>
        </div>
        <div className="h-0 flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={location === item.href ? classes.active : classes.inactive}
              >
                <item.icon className="h-5 w-5 mr-3 text-primary-600" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <a href="#" className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <img
                  className="inline-block h-9 w-9 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Profile picture"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">User</p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">Admin</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
