import React from 'react';

function ServerInfo({ serverInfo, serverUrl, onDisconnect }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-header" style={{ marginBottom: 0 }}>
          Server Information
        </h2>
        <button className="btn btn-secondary" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div className="info-row">
          <span className="info-label">Name:</span>
          <span className="info-value">{serverInfo.name}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Version:</span>
          <span className="info-value">{serverInfo.version}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Transport:</span>
          <span className="info-value">{serverInfo.transport}</span>
        </div>
        {serverInfo.endpoint && (
          <div className="info-row">
            <span className="info-label">MCP Endpoint:</span>
            <span className="info-value">{serverInfo.endpoint}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          Available Endpoints:
        </h3>
        <div className="endpoint-list">
          <div className="endpoint-item">
            <span className="endpoint-method endpoint-method-get">GET</span>
            <span className="endpoint-url">{serverUrl}/health</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Health check</span>
          </div>
          <div className="endpoint-item">
            <span className="endpoint-method endpoint-method-get">GET</span>
            <span className="endpoint-url">{serverUrl}/info</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Server info</span>
          </div>
          <div className="endpoint-item">
            <span className="endpoint-method endpoint-method-post">POST</span>
            <span className="endpoint-url">{serverUrl}/mcp</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>MCP protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerInfo;
