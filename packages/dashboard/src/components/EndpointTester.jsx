import React, { useState } from 'react';

function EndpointTester({ serverUrl, serverInfo }) {
  const [endpoint, setEndpoint] = useState('/health');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const endpoints = [
    { path: '/health', method: 'GET', description: 'Server health check' },
    { path: '/info', method: 'GET', description: 'Server information' },
    {
      path: '/mcp',
      method: 'POST',
      description: 'MCP protocol endpoint',
      defaultBody: JSON.stringify(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        },
        null,
        2,
      ),
    },
  ];

  const handleEndpointChange = (path) => {
    setEndpoint(path);
    const endpointInfo = endpoints.find((e) => e.path === path);
    if (endpointInfo) {
      setMethod(endpointInfo.method);
      setRequestBody(endpointInfo.defaultBody || '');
    }
    setResponse(null);
    setError(null);
  };

  const testEndpoint = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method === 'POST' && requestBody) {
        options.body = requestBody;
      }

      const startTime = Date.now();
      const res = await fetch(`${serverUrl}${endpoint}`, options);
      const duration = Date.now() - startTime;

      const contentType = res.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
        duration,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
        Endpoint Tester
      </h3>

      <div className="grid grid-2">
        <div>
          <div className="form-group">
            <label className="form-label">Endpoint</label>
            <select
              className="form-input"
              value={endpoint}
              onChange={(e) => handleEndpointChange(e.target.value)}
            >
              {endpoints.map((ep) => (
                <option key={ep.path} value={ep.path}>
                  {ep.method} {ep.path} - {ep.description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Full URL</label>
            <input
              type="text"
              className="form-input"
              value={`${serverUrl}${endpoint}`}
              readOnly
              style={{ background: '#f3f4f6' }}
            />
          </div>

          {method === 'POST' && (
            <div className="form-group">
              <label className="form-label">Request Body (JSON)</label>
              <textarea
                className="form-input"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '14px' }}
                placeholder='{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={testEndpoint}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Testing...
              </>
            ) : (
              `Test ${method} Request`
            )}
          </button>
        </div>

        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            Response
          </h4>

          {error && (
            <div
              style={{
                padding: '12px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '8px',
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          {response && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span
                    className="info-value"
                    style={{
                      color: response.status < 400 ? '#10b981' : '#ef4444',
                      fontWeight: '600',
                    }}
                  >
                    {response.status} {response.statusText}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{response.duration}ms</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Headers:
                </h5>
                <pre
                  style={{
                    background: '#f3f4f6',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              </div>

              <div>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Body:
                </h5>
                <pre
                  style={{
                    background: '#f3f4f6',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '400px',
                  }}
                >
                  {typeof response.data === 'object'
                    ? JSON.stringify(response.data, null, 2)
                    : response.data}
                </pre>
              </div>
            </div>
          )}

          {!response && !error && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Click "Test Request" to see the response
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EndpointTester;
