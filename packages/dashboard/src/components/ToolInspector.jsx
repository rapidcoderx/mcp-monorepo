import React, { useState } from 'react';

function ToolInspector({ tools, serverUrl }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [params, setParams] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    setResult(null);
    setError(null);
    // Initialize params with empty values
    const initialParams = {};
    if (tool.inputSchema?.properties) {
      Object.keys(tool.inputSchema.properties).forEach((key) => {
        initialParams[key] = '';
      });
    }
    setParams(initialParams);
  };

  const handleParamChange = (paramName, value) => {
    setParams((prev) => ({ ...prev, [paramName]: value }));
  };

  const executeTool = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call tool via MCP protocol
      const response = await fetch(`${serverUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool.name,
            arguments: params,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tools || tools.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        No tools available on this server
      </div>
    );
  }

  return (
    <div className="grid grid-2">
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Available Tools
        </h3>
        <div className="tool-list">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="tool-item"
              onClick={() => handleToolSelect(tool)}
              style={{
                borderColor: selectedTool?.name === tool.name ? '#3b82f6' : undefined,
                background: selectedTool?.name === tool.name ? '#eff6ff' : undefined,
              }}
            >
              <div className="tool-name">{tool.name}</div>
              <div className="tool-description">{tool.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedTool ? (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              {selectedTool.name}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {selectedTool.description}
            </p>

            {selectedTool.inputSchema?.properties &&
              Object.keys(selectedTool.inputSchema.properties).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                    Parameters:
                  </h4>
                  {Object.entries(selectedTool.inputSchema.properties).map(
                    ([paramName, paramSchema]) => (
                      <div key={paramName} className="form-group">
                        <label className="form-label">
                          {paramName}
                          {selectedTool.inputSchema.required?.includes(paramName) && (
                            <span style={{ color: '#ef4444' }}>*</span>
                          )}
                        </label>
                        {paramSchema.type === 'string' && !paramSchema.enum && (
                          <input
                            type="text"
                            className="form-input"
                            value={params[paramName] || ''}
                            onChange={(e) => handleParamChange(paramName, e.target.value)}
                            placeholder={paramSchema.description}
                          />
                        )}
                        {paramSchema.enum && (
                          <select
                            className="form-input"
                            value={params[paramName] || ''}
                            onChange={(e) => handleParamChange(paramName, e.target.value)}
                          >
                            <option value="">Select...</option>
                            {paramSchema.enum.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                        {paramSchema.description && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {paramSchema.description}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}

            <button
              className="btn btn-primary"
              onClick={executeTool}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Executing...
                </>
              ) : (
                'Execute Tool'
              )}
            </button>

            {error && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '8px',
                }}
              >
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="result-container">
                <div className="result-label">Result:</div>
                <div className="result-content">
                  {result.content?.[0]?.text || JSON.stringify(result, null, 2)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Select a tool from the list to inspect and test it
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolInspector;
