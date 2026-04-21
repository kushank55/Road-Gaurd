import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Trans } from '@/components/Trans';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-foreground">
                <Trans translationKey="dashboard.title" text="Dashboard" />
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeToggle variant="icon" />
              <span className="text-muted-foreground">
                <Trans translationKey="dashboard.welcome" text="Welcome" />, {user?.name || 'User'}!
              </span>
              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trans translationKey="dashboard.logout" text="Logout" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Theme Demo Section */}
            <div className="mb-8 bg-background border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                <Trans translationKey="dashboard.themeDemo" text="Theme Controls" />
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Icon Toggle */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Icon Toggle</h3>
                  <ThemeToggle variant="icon" />
                </div>
                
                {/* Dropdown */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Dropdown</h3>
                  <ThemeToggle variant="dropdown" />
                </div>
                
                {/* Segmented Control */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Segmented Control</h3>
                  <ThemeToggle variant="segmented" />
                </div>
              </div>
              
              {/* Theme Information */}
              <div className="mt-6 p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Current theme: <span className="font-medium text-foreground">{useTheme().theme}</span>
                  {' | '}
                  Resolved: <span className="font-medium text-foreground">{useTheme().resolvedTheme}</span>
                  {' | '}
                  System: <span className="font-medium text-foreground">{useTheme().systemTheme}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          <Trans translationKey="dashboard.totalProjects" text="Total Projects" />
                        </dt>
                        <dd className="text-lg font-medium text-foreground">12</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          <Trans translationKey="dashboard.completedTasks" text="Completed Tasks" />
                        </dt>
                        <dd className="text-lg font-medium text-foreground">8</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8zm-1 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          <Trans translationKey="dashboard.pendingTasks" text="Pending Tasks" />
                        </dt>
                        <dd className="text-lg font-medium text-foreground">4</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <div className="bg-card shadow rounded-lg border border-border">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-foreground">
                    <Trans translationKey="dashboard.recentActivity" text="Recent Activity" />
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    <Trans translationKey="dashboard.recentActivityDesc" text="Your latest actions and updates." />
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    <li className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          <Trans translationKey="dashboard.activity.newProject" text={`New project created: E-commerce Website`} />
                        </div>
                        <div className="ml-2 flex-shrink-0 text-sm text-gray-500">
                          <Trans translationKey="dashboard.activity.2hoursAgo" text="2 hours ago" />
                        </div>
                      </div>
                    </li>
                    <li className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          <Trans translationKey="dashboard.activity.taskCompleted" text={`Task completed: Design homepage mockup`} />
                        </div>
                        <div className="ml-2 flex-shrink-0 text-sm text-gray-500">
                          <Trans translationKey="dashboard.activity.4hoursAgo" text="4 hours ago" />
                        </div>
                      </div>
                    </li>
                    <li className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          <Trans translationKey="dashboard.activity.teamMemberAdded" text={`Team member added: Sarah Johnson`} />
                        </div>
                        <div className="ml-2 flex-shrink-0 text-sm text-gray-500">
                          <Trans translationKey="dashboard.activity.1dayAgo" text="1 day ago" />
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
