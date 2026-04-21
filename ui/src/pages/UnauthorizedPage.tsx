import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getRoleRedirectPath, getRoleDisplayName } from '@/lib/role.utils';

const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Denied
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            You don't have permission to access this page.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Current role: <span className="font-medium">{getRoleDisplayName(user?.role)}</span>
            </p>
          </div>
          
          <div className="space-y-3">
            <Link to={getRoleRedirectPath(user?.role)}>
              <Button className="w-full" variant="default">
                Go to Your Dashboard
              </Button>
            </Link>
            
            <Link to="/">
              <Button className="w-full" variant="outline">
                Go to Home
              </Button>
            </Link>
            
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => logout()}
            >
              Sign Out
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
