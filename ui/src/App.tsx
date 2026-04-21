import { RouterProvider } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { TranslationProvider } from '@/contexts/TranslationProvider';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { router } from '@/routes';

export default function App() {
  return (
    <NuqsAdapter>
      <ThemeProvider>
        <TranslationProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </TranslationProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}