import React from "react";
export default function TemplatePreviewModal({ open, template, onClose }: any) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", 
      background: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#232438", color: "#fff", padding: 48, borderRadius: 24, minWidth: 400, minHeight: 200
      }}>
        <div style={{ fontSize: 26, marginBottom: 18 }}>Template Preview</div>
        <pre style={{ maxHeight: 300, overflow: "auto", background: "#191a21", padding: 18, borderRadius: 12 }}>{JSON.stringify(template, null, 2)}</pre>
        <button onClick={onClose} style={{ marginTop: 24, background: "#FFD600", color: "#232438", fontWeight: 600, border: "none", padding: "10px 32px", borderRadius: 8 }}>
          Close
        </button>
      </div>
    </div>
  );
}
