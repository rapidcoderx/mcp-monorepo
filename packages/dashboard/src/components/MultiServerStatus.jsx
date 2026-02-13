import { useState, useEffect } from 'react';

/**
 * MultiServerStatus Component
 * 
 * Shows health status of all configured servers at a glance
 */
export default function MultiServerStatus({ onServerClick }) {
  const [servers, setServers] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServersAndCheck();
    const interval = setInterval(loadServersAndCheck, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const loadServersAndCheck = async () => {
    try {
      const configUrl = import.meta.env.DEV 
        ? '/api/config'
        : `${window.location.origin}/api/config`;
      
      const response = await fetch(configUrl);
      const config = await response.json();
      const enabledServers = config.servers.filter(s => s.enabled);
      setServers(enabledServers);
      
      // Check health of all servers
      const statusPromises = enabledServers.map(async (server) => {
        try {
          const healthResponse = await fetch(`${server.url}/health`, {
            signal: AbortSignal.timeout(5000)
          });
          if (healthResponse.ok) {
            const data = await healthResponse.json();
            return { id: server.id, status: 'online', data };
          }
          return { id: server.id, status: 'error' };
        } catch (error) {
          return { id: server.id, status: 'offline', error: error.message };
        }
      });
      
      const results = await Promise.all(statusPromises);
      const statusMap = {};
      results.forEach(result => {
        statusMap[result.id] = result;
      });
      setStatuses(statusMap);
    } catch (error) {
      console.error('Error loading server statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="multi-server-status loading">Loading server statuses...</div>;
  }

  return (
    <div className="multi-server-status">
      <h3>Server Status Overview</h3>
      <div className="server-grid">
        {servers.map(server => {
          const status = statuses[server.id];
          const isOnline = status?.status === 'online';
          
          return (
            <div 
              key={server.id} 
              className={`server-card ${isOnline ? 'online' : 'offline'}`}
              onClick={() => isOnline && onServerClick(server)}
              style={{ borderColor: server.color }}
            >
              <div className="server-card-header">
                <span 
                  className="status-dot" 
                  style={{ backgroundColor: isOnline ? '#4CAF50' : '#f44336' }}
                />
                <h4>{server.name}</h4>
              </div>
              <p className="server-url">{server.url}</p>
              <p className="server-description">{server.description}</p>
              <div className="server-status-text">
                {status?.status === 'online' && (
                  <span className="status-online">✓ Online</span>
                )}
                {status?.status === 'offline' && (
                  <span className="status-offline">✗ Offline</span>
                )}
                {status?.status === 'error' && (
                  <span className="status-error">⚠ Error</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
