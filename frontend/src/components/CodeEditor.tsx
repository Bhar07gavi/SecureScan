import React, { useState, useEffect, useRef, useCallback } from 'react';
// NEW (correct):
import {
  Shield,
  Code,
  Upload,
  File,
  Folder,
  Copy,
  Check,
  X,
  Play,
  RefreshCw,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Search,
  Plus,
  Minus,
  Maximize,
  Minimize
} from 'lucide-react';
import { InputMode } from '../types';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  onFileUpload: (files: FileList) => void;
  highlightedLines: number[];
  isScanning: boolean;
}

// Supported file extensions
const SUPPORTED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.php',
  '.rb', '.go', '.rs', '.cs', '.cpp', '.c', '.swift',
  '.kt', '.scala', '.sql', '.html', '.xml',
];

// Language detection from extension
const getLanguageFromFile = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    js: 'JavaScript', jsx: 'React JSX', ts: 'TypeScript', tsx: 'React TSX',
    py: 'Python', java: 'Java', php: 'PHP', rb: 'Ruby', go: 'Go',
    rs: 'Rust', cs: 'C#', cpp: 'C++', c: 'C', swift: 'Swift',
    kt: 'Kotlin', scala: 'Scala', sql: 'SQL', html: 'HTML', xml: 'XML',
  };
  return langMap[ext || ''] || 'Unknown';
};

// Detect language from code content
const detectLanguageFromCode = (code: string): string => {
  if (code.includes('import React') || code.includes('from "react"')) return 'JavaScript (React)';
  if (code.includes('interface ') && code.includes(': string')) return 'TypeScript';
  if (code.includes('def ') || (code.includes('import ') && code.includes(':'))) return 'Python';
  if (code.includes('public class') || code.includes('System.out')) return 'Java';
  if (code.includes('<?php')) return 'PHP';
  if (code.includes('package main') || code.includes('func main')) return 'Go';
  if (code.includes('fn main()')) return 'Rust';
  if (code.includes('using System;')) return 'C#';
  if (code.includes('SELECT') || code.includes('INSERT')) return 'SQL';
  return 'JavaScript';
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  inputMode,
  onInputModeChange,
  onFileUpload,
  highlightedLines,
  isScanning,
}) => {
  const [lineNumbers, setLineNumbers] = useState<number[]>([1]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('JavaScript');
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Update line numbers and stats
  useEffect(() => {
    const lines = code.split('\n');
    setLineNumbers(Array.from({ length: lines.length }, (_, i) => i + 1));
    setLineCount(lines.length);
    setCharCount(code.length);
    setDetectedLanguage(detectLanguageFromCode(code));
  }, [code]);

  // Sync scroll between line numbers and textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumberRef.current) {
      lineNumberRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Track cursor position
  const handleCursorChange = useCallback(() => {
    if (textareaRef.current) {
      const { selectionStart } = textareaRef.current;
      const textBeforeCursor = code.substring(0, selectionStart);
      const lines = textBeforeCursor.split('\n');
      setCursorPosition({
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
      });
    }
  }, [code]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Unindent
        const lineStart = code.lastIndexOf('\n', start - 1) + 1;
        if (code.substring(lineStart, lineStart + 2) === '  ') {
          const newCode = code.substring(0, lineStart) + code.substring(lineStart + 2);
          onChange(newCode);
          setTimeout(() => {
            textarea.selectionStart = start - 2;
            textarea.selectionEnd = end - 2;
          }, 0);
        }
      } else {
        // Indent
        const newCode = code.substring(0, start) + '  ' + code.substring(end);
        onChange(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }

    // Ctrl+A to select all
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      // Default behavior is fine
    }

    // Ctrl+D to duplicate line
    if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = code.indexOf('\n', start);
      const currentLine = code.substring(lineStart, lineEnd === -1 ? code.length : lineEnd);
      const newCode = code.substring(0, lineEnd === -1 ? code.length : lineEnd) +
        '\n' + currentLine + code.substring(lineEnd === -1 ? code.length : lineEnd);
      onChange(newCode);
    }

    // Increase/Decrease font size
    if ((e.ctrlKey || e.metaKey) && e.key === '=') {
      e.preventDefault();
      setFontSize(prev => Math.min(prev + 1, 24));
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault();
      setFontSize(prev => Math.max(prev - 1, 10));
    }
  }, [code, onChange]);

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedFiles(files);
      onFileUpload(e.target.files);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(files);

      // If single file, read content into editor
      if (files.length === 1) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onChange(content);
          onInputModeChange('editor');
        };
        reader.readAsText(files[0]);
      } else {
        // Multiple files - switch to project mode
        onInputModeChange('project');
        const dataTransfer = new DataTransfer();
        files.forEach(f => dataTransfer.items.add(f));
        onFileUpload(dataTransfer.files);
      }
    }
  }, [onChange, onFileUpload, onInputModeChange]);

  // Copy code
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Clear code
  const handleClear = () => {
    if (code && window.confirm('Are you sure you want to clear all code?')) {
      onChange('');
      setUploadedFiles([]);
    }
  };

  // Download code
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-scan.${detectedLanguage.toLowerCase().replace(/[^a-z]/g, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get file size string
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div
      className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'h-full'}`}
      onDragEnter={handleDrag}
      ref={editorContainerRef}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-2">
        {/* Input Mode Tabs */}
        <div className="flex">
          <button
            onClick={() => onInputModeChange('editor')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              inputMode === 'editor'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-900/50'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Code className="w-4 h-4" />
            Code Editor
          </button>
          <button
            onClick={() => onInputModeChange('file')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              inputMode === 'file'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-900/50'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            File Upload
          </button>
          <button
            onClick={() => onInputModeChange('project')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              inputMode === 'project'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-900/50'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Folder className="w-4 h-4" />
            Project Scan
          </button>
        </div>

        {/* Editor Controls */}
        {inputMode === 'editor' && (
          <div className="flex items-center gap-1">
            {/* Language Badge */}
            <span className="px-2 py-1 bg-gray-700 rounded text-xs text-cyan-400 mr-2">
              {detectedLanguage}
            </span>

            {/* Font Size */}
            <button
              onClick={() => setFontSize(prev => Math.max(prev - 1, 10))}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors text-xs"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="text-xs text-gray-500 w-6 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize(prev => Math.min(prev + 1, 24))}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors text-xs"
              title="Increase font size"
            >
              A+
            </button>

            <div className="w-px h-4 bg-gray-700 mx-1" />

            {/* Word Wrap */}
            <button
              onClick={() => setWordWrap(!wordWrap)}
              className={`p-1.5 rounded transition-colors text-xs ${
                wordWrap ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
              }`}
              title="Toggle word wrap"
            >
              Wrap
            </button>

            <div className="w-px h-4 bg-gray-700 mx-1" />

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="Copy code"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="Download code"
              disabled={!code}
            >
              <Download size={14} />
            </button>

            {/* Clear */}
            <button
              onClick={handleClear}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
              title="Clear code"
              disabled={!code}
            >
              <Trash2 size={14} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Drag & Drop Overlay */}
        {dragActive && (
          <div
            className="absolute inset-0 z-40 bg-cyan-500/10 border-2 border-dashed border-cyan-400 rounded-lg flex items-center justify-center"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-bounce" />
              <p className="text-lg font-semibold text-cyan-400">Drop files here</p>
              <p className="text-sm text-gray-400 mt-1">
                Single file opens in editor, multiple files start project scan
              </p>
            </div>
          </div>
        )}

        {/* Code Editor Mode */}
        {inputMode === 'editor' && (
          <div className="absolute inset-0 flex" onDragOver={handleDrag}>
            {/* Line Numbers */}
            <div
              ref={lineNumberRef}
              className="w-14 bg-gray-900 text-right pr-3 pt-4 select-none overflow-hidden border-r border-gray-800 flex-shrink-0"
              style={{ fontSize: `${fontSize}px` }}
            >
              {lineNumbers.map((num) => (
                <div
                  key={num}
                  className={`leading-6 font-mono transition-colors ${
                    highlightedLines.includes(num)
                      ? 'text-red-400 bg-red-900/30 font-bold'
                      : cursorPosition.line === num
                        ? 'text-cyan-400'
                        : 'text-gray-600'
                  }`}
                  style={{ lineHeight: `${fontSize * 1.7}px` }}
                >
                  {num}
                </div>
              ))}
            </div>

            {/* Highlighted Lines Background */}
            <div className="absolute left-14 right-0 top-0 bottom-0 pointer-events-none z-10">
              {highlightedLines.map(lineNum => (
                <div
                  key={lineNum}
                  className="absolute left-0 right-0 bg-red-900/10 border-l-2 border-red-500"
                  style={{
                    top: `${(lineNum - 1) * fontSize * 1.7 + 16}px`,
                    height: `${fontSize * 1.7}px`,
                  }}
                />
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              onClick={handleCursorChange}
              onKeyUp={handleCursorChange}
              className={`flex-1 bg-gray-900 text-gray-100 p-4 font-mono resize-none outline-none focus:ring-0 ${
                wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'
              }`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: `${fontSize * 1.7}px`,
                tabSize: 2,
              }}
              placeholder={`// Paste your code here to analyze for vulnerabilities...
// Supports: JavaScript, TypeScript, Python, Java, PHP, Go, Rust, C/C++

// Example vulnerable code:
const password = "admin123";
eval(userInput);
os.system("ping " + host);

// Keyboard shortcuts:
// Tab         - Indent
// Shift+Tab   - Unindent
// Ctrl+D      - Duplicate line
// Ctrl+/- 	   - Zoom in/out`}
              spellCheck={false}
              disabled={isScanning}
            />

            {/* Minimap (simplified) */}
            {showMinimap && code.length > 100 && (
              <div className="w-20 bg-gray-950 border-l border-gray-800 overflow-hidden flex-shrink-0 hidden xl:block">
                <div className="p-1 transform scale-[0.15] origin-top-left w-[667%]">
                  <pre className="text-gray-600 font-mono text-[10px] leading-tight whitespace-pre-wrap break-all">
                    {code.substring(0, 5000)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Upload Mode */}
        {inputMode === 'file' && (
          <div className="flex flex-col items-center justify-center h-full p-8" onDragOver={handleDrag}>
            <label className={`flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500'
            }`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className={`w-12 h-12 mb-4 ${dragActive ? 'text-cyan-400 animate-bounce' : 'text-gray-400'}`} />
                <p className="mb-2 text-sm text-gray-300">
                  <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  Supports: JS, TS, PY, JAVA, PHP, GO, RS, C, CPP (Max 10MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={SUPPORTED_EXTENSIONS.join(',')}
                multiple
                onChange={handleFileChange}
              />
            </label>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 w-full max-w-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Uploaded Files ({uploadedFiles.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <File className="text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-200 truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span className="text-cyan-400">{getLanguageFromFile(file.name)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Content Preview */}
            {code && (
              <div className="mt-4 w-full max-w-lg">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">File content preview:</p>
                    <button
                      onClick={() => onInputModeChange('editor')}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Open in Editor →
                    </button>
                  </div>
                  <pre className="text-xs text-gray-300 max-h-40 overflow-auto font-mono bg-gray-900 rounded p-3">
                    {code.slice(0, 1000)}
                    {code.length > 1000 && '\n... (truncated)'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Scan Mode */}
        {inputMode === 'project' && (
          <div className="flex flex-col items-center justify-center h-full p-8" onDragOver={handleDrag}>
            <label className={`flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-500'
            }`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Folder className={`w-12 h-12 mb-4 ${dragActive ? 'text-cyan-400 animate-bounce' : 'text-gray-400'}`} />
                <p className="mb-2 text-sm text-gray-300">
                  <span className="font-semibold text-cyan-400">Select project folder</span>
                </p>
                <p className="text-xs text-gray-500 text-center">
                  All code files will be scanned for vulnerabilities
                  <br />
                  Supports nested directories
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                multiple
                // @ts-ignore
                webkitdirectory=""
                directory=""
                onChange={handleFileChange}
              />
            </label>

            {/* Uploaded Project Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-400">
                    Project Files ({uploadedFiles.length})
                  </h4>
                  <span className="text-xs text-gray-500">
                    Total: {formatFileSize(uploadedFiles.reduce((sum, f) => sum + f.size, 0))}
                  </span>
                </div>

                {/* File Type Summary */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(
                    uploadedFiles.reduce((acc, file) => {
                      const lang = getLanguageFromFile(file.name);
                      acc[lang] = (acc[lang] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([lang, count]) => (
                    <span key={lang} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      {lang}: {count}
                    </span>
                  ))}
                </div>

                {/* File List */}
                <div className="space-y-1 max-h-48 overflow-auto bg-gray-900 rounded-lg p-2">
                  {uploadedFiles.slice(0, 50).map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800 text-xs"
                    >
                      <File size={12} className="text-cyan-400 flex-shrink-0" />
                      <span className="text-gray-300 truncate flex-1 font-mono">
                        {file.webkitRelativePath || file.name}
                      </span>
                      <span className="text-gray-500 flex-shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                  {uploadedFiles.length > 50 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      ... and {uploadedFiles.length - 50} more files
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-gray-900/85 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
                <Shield className="absolute inset-0 m-auto w-7 h-7 text-cyan-400" />
              </div>
              <p className="text-cyan-400 font-semibold text-lg">Analyzing Code...</p>
              <p className="text-gray-500 text-sm mt-1">
                Scanning for vulnerabilities with AI (98.57% accuracy)
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {inputMode === 'editor' && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </span>
            <span>{lineCount} lines</span>
            <span>{charCount} chars</span>
            <span className="text-cyan-400">{detectedLanguage}</span>
          </div>
          <div className="flex items-center gap-4">
            {highlightedLines.length > 0 && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                {highlightedLines.length} issues
              </span>
            )}
            <span>UTF-8</span>
            <span>Spaces: 2</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;