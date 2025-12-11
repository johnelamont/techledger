import { useAuth, SignIn } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();

  // Loading state
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not signed in - show Clerk's sign in component
  if (!isSignedIn) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <SignIn 
          routing="hash"
          signUpUrl="/sign-up"
        />
      </div>
    );
  }

  // Signed in - show app
  return <>{children}</>;
}