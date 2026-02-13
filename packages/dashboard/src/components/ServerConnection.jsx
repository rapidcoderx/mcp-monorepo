import React from 'react';

function ServerConnection({ serverUrl, setServerUrl, onConnect, loading, error }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect();
  };

  return (
    <div className="card">
      <h2 className="card-header">Connect to MCP Server</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Server URL</label>
          <input
            type="text"
            className="form-input"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:3000"
            disabled={loading}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Connecting...
            </>
          ) : (
            'Connect'
          )}
        </button>
      </form>

      <div style={{ marginTop: '24px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          Quick Start:
        </h3>
        <ol style={{ paddingLeft: '20px', fontSize: '14px', color: '#6b7280' }}>
          <li>Start your MCP server: <code>npm run start:http -w @mcp/echo-server</code></li>
          <li>Server will be available at: <code>http://localhost:3000</code></li>
          <li>Click "Connect" above to start testing</li>
        </ol>
      </div>
    </div>
  );
}

export default ServerConnection;
