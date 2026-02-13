import React, { useState } from 'react';

function ResourceViewer({ resources, serverUrl }) {
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceContent, setResourceContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResourceSelect = async (resource) => {
    setSelectedResource(resource);
    setResourceContent(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${serverUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'resources/read',
          params: {
            uri: resource.uri,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      setResourceContent(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!resources || resources.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        No resources available on this server
      </div>
    );
  }

  return (
    <div className="grid grid-2">
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Available Resources
        </h3>
        <div className="tool-list">
          {resources.map((resource) => (
            <div
              key={resource.uri}
              className="tool-item"
              onClick={() => handleResourceSelect(resource)}
              style={{
                borderColor: selectedResource?.uri === resource.uri ? '#3b82f6' : undefined,
                background: selectedResource?.uri === resource.uri ? '#eff6ff' : undefined,
              }}
            >
              <div className="tool-name">{resource.name}</div>
              <div className="tool-description">{resource.description}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                <code>{resource.uri}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedResource ? (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              {selectedResource.name}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {selectedResource.description}
            </p>
            <div style={{ marginBottom: '16px' }}>
              <div className="info-row">
                <span className="info-label">URI:</span>
                <span className="info-value">{selectedResource.uri}</span>
              </div>
              {selectedResource.mimeType && (
                <div className="info-row">
                  <span className="info-label">MIME Type:</span>
                  <span className="info-value">{selectedResource.mimeType}</span>
                </div>
              )}
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <span className="spinner"></span>
              </div>
            )}

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

            {resourceContent && (
              <div className="result-container">
                <div className="result-label">Content:</div>
                <div className="result-content">
                  {resourceContent.contents?.[0]?.text ||
                    JSON.stringify(resourceContent, null, 2)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Select a resource from the list to view its content
          </div>
        )}
      </div>
    </div>
  );
}

export default ResourceViewer;
