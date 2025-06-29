/**
 * CDN-enabled File Uploader Component
 * Supports uploading files with optional CDN storage for JSON results
 */

"use client";

import { useState, useRef } from "react";

interface CdnUploadOptions {
  useCdn: boolean;
  cdnFilename?: string;
}

interface CdnUploadResult {
  success: boolean;
  cdnUrl?: string;
  cdnId?: string;
  data?: any;
  filename: string;
  size?: number;
  contentType?: string;
  metadata?: any;
  cdnError?: {
    message: string;
    details: string;
  };
  debug?: any;
}

interface CdnFileUploaderProps {
  onFileUpload: (file: File, options: CdnUploadOptions) => void;
  onUploadResult?: (result: CdnUploadResult) => void;
  loading: boolean;
  lastResult?: CdnUploadResult;
}

export function CdnFileUploader({ 
  onFileUpload, 
  onUploadResult,
  loading, 
  lastResult 
}: CdnFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [useCdn, setUseCdn] = useState(false);
  const [cdnFilename, setCdnFilename] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const options: CdnUploadOptions = {
        useCdn,
        cdnFilename: cdnFilename.trim() || undefined,
      };
      onFileUpload(file, options);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const copyToClipboard = async (text: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      alert("Clipboard API not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      alert("URL copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy URL:", err);
      alert("Failed to copy URL to clipboard");
    }
  };

  const openInNewTab = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const downloadJson = (url: string, filename: string) => {
    if (typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cdn-file-uploader">
      {/* Upload Section */}
      <div className="upload-section" style={{ marginBottom: "20px" }}>
        <div className="upload-options" style={{ marginBottom: "15px" }}>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={useCdn}
                onChange={(e) => setUseCdn(e.target.checked)}
                disabled={loading}
              />
              <span>Upload JSON to CDN (recommended for large files)</span>
            </label>
          </div>
          
          {useCdn && (
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Custom filename (optional):
              </label>
              <input
                type="text"
                value={cdnFilename}
                onChange={(e) => setCdnFilename(e.target.value)}
                placeholder="e.g., my-presentation.json"
                disabled={loading}
                style={{
                  width: "300px",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>
          )}
        </div>

        <button
          onClick={handleClick}
          disabled={loading}
          style={{
            width: "300px",
            height: "80px",
            backgroundColor: loading ? "#999" : "#d14424",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {loading ? (
            <>
              <div className="spinner" style={{
                width: "20px",
                height: "20px",
                border: "2px solid #ffffff40",
                borderTop: "2px solid #ffffff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              Converting...
            </>
          ) : (
            <>
              📁 Choose PPTX File
              {useCdn && <span style={{ fontSize: "14px" }}>☁️</span>}
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".pptx"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Results Section */}
      {lastResult && (
        <div className="results-section" style={{ marginTop: "20px" }}>
          {lastResult.success && lastResult.cdnUrl ? (
            /* CDN Upload Success */
            <div className="cdn-result" style={{
              padding: "20px",
              backgroundColor: "#e8f5e8",
              border: "1px solid #4caf50",
              borderRadius: "8px",
              marginBottom: "20px",
            }}>
              <h3 style={{ color: "#2e7d32", marginBottom: "15px" }}>
                ☁️ JSON Uploaded to CDN Successfully
              </h3>
              
              <div style={{ marginBottom: "15px" }}>
                <strong>Public URL:</strong>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "5px",
                }}>
                  <input
                    type="text"
                    value={lastResult.cdnUrl}
                    readOnly
                    style={{
                      flex: 1,
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      backgroundColor: "#f9f9f9",
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(lastResult.cdnUrl!)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2196f3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => openInNewTab(lastResult.cdnUrl!)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ff9800",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    🔗 Open
                  </button>
                  <button
                    onClick={() => downloadJson(lastResult.cdnUrl!, lastResult.filename)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#4caf50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    💾 Download
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "14px", color: "#666" }}>
                <div><strong>File:</strong> {lastResult.filename}</div>
                <div><strong>Size:</strong> {lastResult.size ? `${(lastResult.size / 1024).toFixed(2)} KB` : 'Unknown'}</div>
                <div><strong>CDN ID:</strong> {lastResult.cdnId}</div>
                {lastResult.metadata && (
                  <div><strong>Uploaded:</strong> {lastResult.metadata.uploadedAt || 'Unknown'}</div>
                )}
              </div>
            </div>
          ) : lastResult.success && lastResult.data ? (
            /* Direct JSON Response */
            <div className="direct-result" style={{
              padding: "20px",
              backgroundColor: "#e3f2fd",
              border: "1px solid #2196f3",
              borderRadius: "8px",
              marginBottom: "20px",
            }}>
              <h3 style={{ color: "#1976d2", marginBottom: "15px" }}>
                📄 JSON Response (Direct)
              </h3>
              <div style={{ fontSize: "14px", color: "#666" }}>
                <div><strong>File:</strong> {lastResult.filename}</div>
                <div><strong>Slides:</strong> {lastResult.data?.slides?.length || 0}</div>
                <div><strong>Theme:</strong> {lastResult.data?.theme ? 'Yes' : 'No'}</div>
              </div>
            </div>
          ) : null}

          {lastResult.cdnError && (
            <div className="cdn-error" style={{
              padding: "15px",
              backgroundColor: "#fff3e0",
              border: "1px solid #ff9800",
              borderRadius: "8px",
              marginBottom: "20px",
            }}>
              <h4 style={{ color: "#f57c00", marginBottom: "10px" }}>
                ⚠️ CDN Upload Warning
              </h4>
              <div style={{ fontSize: "14px" }}>
                <div><strong>Message:</strong> {lastResult.cdnError.message}</div>
                <div><strong>Details:</strong> {lastResult.cdnError.details}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}