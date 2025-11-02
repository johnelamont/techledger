import { useEffect, useState } from 'react'
import './App.css'
import { healthCheck } from './services/api'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

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

  return (
    <div className="App">
      <h1>TechLedger</h1>
      <h2>Local Development Environment</h2>
      <p>API Status: {apiStatus}</p>
      <div className="card">
        <h3>Environment Check:</h3>
        <ul style={{ textAlign: 'left' }}>
          <li>Frontend: Running on http://localhost:5173</li>
          <li>Backend: Running on http://localhost:3001</li>
          <li>Database: PostgreSQL on localhost:5432</li>
        </ul>
      </div>
    </div>
  )
}

export default App