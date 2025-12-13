import { useEffect, useState } from 'react'
import { useAuth, UserButton } from '@clerk/clerk-react'
import './App.css'
import { healthCheck } from './services/api'
import { AuthGuard } from './components/AuthGuard'

function AppContent() {
  const { getToken, userId } = useAuth();
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [userStatus, setUserStatus] = useState<string>('');

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const data = await healthCheck();
        setApiStatus(`✅ Connected: ${data.message}`);
      } catch (error) {
        setApiStatus('❌ Backend not responding');
      }
    };
    checkAPI();
  }, []);

  // Test authenticated endpoint
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        console.log('🔑 Frontend: Got token from Clerk, length:', token?.length);

        if (token) {
          console.log('📡 Frontend: Calling /api/users/me with Bearer token');
          const response = await fetch('http://localhost:3001/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('📥 Frontend: Response status:', response.status);
          const data = await response.json();
          console.log('📦 Frontend: Response data:', data);

          if (data.success) {
            setUserStatus(`✅ Authenticated as: ${data.data.clerkUserId}`);
          } else {
            setUserStatus(`❌ Auth failed: ${data.error || 'Unknown error'}`);
          }
        } else {
          setUserStatus('❌ No token available');
        }
      } catch (error: any) {
        console.error('❌ Frontend: Auth check error:', error);
        setUserStatus(`❌ Auth check failed: ${error.message}`);
      }
    };
    checkAuth();
  }, [getToken]);

  return (
    <div className="App">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1rem 2rem',
        borderBottom: '1px solid #ccc',
        backgroundColor: '#fff'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>TechLedger MVP</h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#666' }}>
            User ID: {userId?.substring(0, 12)}...
          </p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>
      
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0.5rem 0' }}>
            API Status: {apiStatus}
          </p>
          <p style={{ fontSize: '14px', color: '#666', margin: '0.5rem 0' }}>
            Auth Status: {userStatus}
          </p>
        </div>
        <hr />
        
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>🎉 Authentication Working!</h2>
          <p>You're signed in and authenticated with the backend.</p>
          <p style={{ marginTop: '2rem', color: '#666' }}>
            Next steps: Build your documentation features here
          </p>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  );
}

export default App;