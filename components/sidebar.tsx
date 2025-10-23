'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  CreditCard, 
  BarChart3, 
  HelpCircle, 
  Menu, 
  X,
  Home,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { 
    name: 'Payments', 
    href: '/', 
    icon: CreditCard,
    submenu: [
      { name: 'Email Settings', href: '/email-settings', icon: Settings }
    ]
  },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Support', href: '/support', icon: HelpCircle },
];

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.svg" alt="DunningPro Logo" className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">DunningPro</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const hasActiveSubmenu = item.submenu && item.submenu.some(sub => pathname === sub.href);
              const isExpanded = expandedMenus.includes(item.name);
              
              if (item.submenu) {
                return (
                  <div key={item.name}>
                    <div className="flex">
                      <Link
                        href={item.href}
                        className={`
                          flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-l-lg transition-colors
                          ${isActive 
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' 
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`
                          px-2 py-2 text-sm font-medium rounded-r-lg transition-colors
                          ${isActive 
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' 
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`
                                flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                                ${isSubActive 
                                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' 
                                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }
                              `}
                              onClick={() => {
                                setSidebarOpen(false);
                                // Auto-expand parent menu when submenu is clicked
                                if (!isExpanded) {
                                  toggleMenu(item.name);
                                }
                              }}
                            >
                              <subItem.icon className="mr-3 h-4 w-4" />
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' 
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer"
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
    </>
  );
}
