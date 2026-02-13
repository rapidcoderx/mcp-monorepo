import React, { useState, useEffect } from 'react';
import ServerSelector from './components/ServerSelector';
import MultiServerStatus from './components/MultiServerStatus';
import ServerConnection from './components/ServerConnection';
import ServerInfo from './components/ServerInfo';
import ToolInspector from './components/ToolInspector';
import ResourceViewer from './components/ResourceViewer';
import EndpointTester from './components/EndpointTester';

function App() {
  const [currentServer, setCurrentServer] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const connectToServer = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/info`);
      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.statusText}`);
      }

      const data = await response.json();
      setServerInfo(data);
      setConnected(true);
    } catch (err) {
      setError(err.message);
      setConnected(false);
      setServerInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setServerInfo(null);
    setError(null);
  };

  useEffect(() => {
    // Connect when server is selected
    if (currentServer && currentServer.url !== serverUrl) {
      setServerUrl(currentServer.url);
      // Auto-connect will happen in next effect
    }
  }, [currentServer]);

  useEffect(() => {
    // Auto-connect when serverUrl changes
    if (serverUrl) {
      connectToServer();
    }
  }, [serverUrl]);

  const handleServerChange = (server) => {
    setCurrentServer(server);
    disconnect();
  };

  const handleServerClick = (server) => {
    setCurrentServer(server);
    setActiveTab('tools');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">M</div>
            <span>MCP Dashboard</span>
          </div>
          <div className="header-controls">
            <ServerSelector 
              onServerChange={handleServerChange}
              currentServer={currentServer}
            />
            {connected && serverInfo && (
              <div className="connection-indicator">
                <span className="status-dot-success"></span>
              </div>
            )}
            <button 
              className="info-button"
              onClick={() => setShowInfoModal(true)}
              title="Information"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {showInfoModal && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>About MCP Dashboard</h2>
              <button className="modal-close" onClick={() => setShowInfoModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h3>Dashboard Information</h3>
                <p>
                  Interactive web dashboard for testing, exploring, and validating 
                  MCP (Model Context Protocol) servers. Connect to multiple servers, 
                  execute tools, browse resources, and test endpoints in real-time.
                </p>
              </div>
              {currentServer && (
                <div className="modal-section">
                  <h3>Current Server</h3>
                  <div className="server-details">
                    <div className="server-detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{currentServer.name}</span>
                    </div>
                    <div className="server-detail-row">
                      <span className="detail-label">URL:</span>
                      <span className="detail-value">{currentServer.url}</span>
                    </div>
                    <div className="server-detail-row">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{currentServer.description}</span>
                    </div>
                    {connected && serverInfo && (
                      <>
                        <div className="server-detail-row">
                          <span className="detail-label">Version:</span>
                          <span className="detail-value">{serverInfo.version}</span>
                        </div>
                        <div className="server-detail-row">
                          <span className="detail-label">Tools:</span>
                          <span className="detail-value">{serverInfo.tools?.length || 0}</span>
                        </div>
                        <div className="server-detail-row">
                          <span className="detail-label">Resources:</span>
                          <span className="detail-value">{serverInfo.resources?.length || 0}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="main">
        {!currentServer && (
          <div className="welcome-message">
            <h2>Welcome to MCP Dashboard</h2>
            <p>Loading configured servers...</p>
          </div>
        )}

        {currentServer && !connected && !loading && (
          <ServerConnection
            serverUrl={serverUrl}
            setServerUrl={setServerUrl}
            onConnect={connectToServer}
            loading={loading}
            error={error}
          />
        )}

        {currentServer && connected && serverInfo && (
          <>
            <ServerInfo
              serverInfo={serverInfo}
              serverUrl={serverUrl}
              onDisconnect={disconnect}
            />

            <div className="card">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab ${activeTab === 'tools' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tools')}
                >
                  Tools ({serverInfo.tools?.length || 0})
                </button>
                <button
                  className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resources')}
                >
                  Resources ({serverInfo.resources?.length || 0})
                </button>
                <button
                  className={`tab ${activeTab === 'endpoints' ? 'active' : ''}`}
                  onClick={() => setActiveTab('endpoints')}
                >
                  Endpoints
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'overview' && (
                  <MultiServerStatus onServerClick={handleServerClick} />
                )}

                {activeTab === 'tools' && (
                  <ToolInspector tools={serverInfo.tools} serverUrl={serverUrl} />
                )}

                {activeTab === 'resources' && (
                  <ResourceViewer
                    resources={serverInfo.resources}
                    serverUrl={serverUrl}
                  />
                )}

                {activeTab === 'endpoints' && (
                  <EndpointTester serverUrl={serverUrl} serverInfo={serverInfo} />
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>Built with ❤️ by AI Agents</p>
      </footer>
    </div>
  );
}

export default App;
