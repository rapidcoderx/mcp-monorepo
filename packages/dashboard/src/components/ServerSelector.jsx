import { useState, useEffect } from 'react';

/**
 * ServerSelector Component
 * 
 * Dropdown selector for switching between configured MCP servers
 */
export default function ServerSelector({ onServerChange, currentServer }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // In development, fetch from Vite proxy
      // In production, fetch from dashboard server API
      const configUrl = import.meta.env.DEV 
        ? '/api/config'
        : `${window.location.origin}/api/config`;
      
      const response = await fetch(configUrl);
      if (!response.ok) throw new Error('Failed to load config');
      
      const config = await response.json();
      const enabledServers = config.servers.filter(s => s.enabled);
      setServers(enabledServers);
      
      // Auto-select first enabled server
      if (enabledServers.length > 0 && !currentServer) {
        onServerChange(enabledServers[0]);
      }
    } catch (error) {
      console.error('Error loading server config:', error);
      // Fallback to default
      const fallback = [{
        id: 'echo',
        name: 'Echo Server',
        url: 'http://localhost:3000',
        description: 'Text transformation tools',
        color: '#4CAF50'
      }];
      setServers(fallback);
      if (!currentServer) {
        onServerChange(fallback[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const server = servers.find(s => s.id === e.target.value);
    if (server) {
      onServerChange(server);
    }
  };

  if (loading) {
    return <div className="server-selector loading">Loading servers...</div>;
  }

  return (
    <div className="server-selector">
      <select 
        id="server-select"
        className="modern-select"
        value={currentServer?.id || ''} 
        onChange={handleChange}
      >
        {servers.length === 0 ? (
          <option value="">No servers available</option>
        ) : (
          servers.map(server => (
            <option key={server.id} value={server.id}>
              {server.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
