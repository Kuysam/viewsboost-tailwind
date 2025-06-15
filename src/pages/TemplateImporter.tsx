import React, { useState, useRef } from "react";
import { db } from "../lib/firebase"; // Adjust if your firebase config is elsewhere
import { collection, addDoc } from "firebase/firestore";

export default function TemplateImporter() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import from file upload (old behavior)
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const text = await file.text();
      let templates;
      try {
        templates = JSON.parse(text);
      } catch (jsonErr) {
        setResult("❌ Error: File is not valid JSON.");
        return;
      }
      if (!Array.isArray(templates)) {
        setResult("❌ Error: File JSON must be an array of templates.");
        return;
      }
      setImporting(true);
      const colRef = collection(db, "templates");
      let successCount = 0;
      for (const tpl of templates) {
        try {
          await addDoc(colRef, tpl);
          successCount++;
        } catch (uploadErr: any) {
          setResult(`❌ Error uploading a template: ${uploadErr.message}`);
          setImporting(false);
          return;
        }
      }
      setResult(`✅ Imported ${successCount} templates successfully!`);
    } catch (err: any) {
      setResult(`❌ Error: ${err.message}`);
    }
    setImporting(false);
  }

  function openFileDialog() {
    fileInputRef.current?.click();
  }

  // New: Import from /public/templates/templates_with_previews.json automatically
  async function importFromTemplatesJson() {
    setResult(null);
    setFileName("templates_with_previews.json");
    setImporting(true);
    try {
      // --------- UPDATE THIS PATH if needed ---------
      const response = await fetch("/templates/templates.json");
      if (!response.ok) throw new Error("Could not fetch templates.json file");
      const templates = await response.json();
      if (!Array.isArray(templates)) {
        setResult("❌ Error: File JSON must be an array of templates.");
        setImporting(false);
        return;
      }
      const colRef = collection(db, "templates");
      let successCount = 0;
      for (const tpl of templates) {
        try {
          await addDoc(colRef, tpl);
          successCount++;
        } catch (uploadErr: any) {
          setResult(`❌ Error uploading a template: ${uploadErr.message}`);
          setImporting(false);
          return;
        }
      }
      setResult(`✅ Imported ${successCount} templates successfully from templates_with_previews.json!`);
    } catch (err: any) {
      setResult(`❌ Error: ${err.message}`);
    }
    setImporting(false);
  }

  return (
    <div className="min-h-screen bg-black text-yellow-300 flex flex-col items-center justify-center">
      <h1 className="text-3xl mb-4 font-bold">Batch Import Templates</h1>
      <div className="flex gap-4">
        <button
          onClick={openFileDialog}
          disabled={importing}
          className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-xl shadow hover:bg-yellow-300 transition"
        >
          {importing ? "Importing..." : "Import from File"}
        </button>
        <button
          onClick={importFromTemplatesJson}
          disabled={importing}
          className="bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold text-xl shadow hover:bg-yellow-400 transition"
        >
          {importing ? "Importing..." : "Import All Templates (Auto)"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {fileName && <div className="mt-2 text-yellow-400">Selected file: {fileName}</div>}
      {result && (
        <div className={`mt-6 text-lg ${result.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
          {result}
        </div>
      )}
    </div>
  );
}
