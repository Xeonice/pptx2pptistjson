import JSZip from 'jszip';

/**
 * Interface for file handling service
 */
export interface IFileService {
  /**
   * Load a ZIP file
   */
  loadZip(file: ArrayBuffer | Blob): Promise<JSZip>;

  /**
   * Extract a file from the ZIP
   */
  extractFile(zip: JSZip, path: string): Promise<string>;

  /**
   * Extract a binary file from the ZIP
   */
  extractBinaryFile(zip: JSZip, path: string): Promise<ArrayBuffer>;

  /**
   * Extract a binary file from the ZIP as Buffer
   */
  extractBinaryFileAsBuffer(zip: JSZip, path: string): Promise<Buffer>;

  /**
   * Check if a file exists in the ZIP
   */
  fileExists(zip: JSZip, path: string): boolean;

  /**
   * List all files in the ZIP
   */
  listFiles(zip: JSZip, pattern?: RegExp): string[];

  /**
   * Get file metadata
   */
  getFileInfo(zip: JSZip, path: string): Promise<FileInfo>;
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: Date;
}