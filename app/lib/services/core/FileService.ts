import JSZip from 'jszip';
import { IFileService, FileInfo } from '../interfaces/IFileService';

export class FileService implements IFileService {
  async loadZip(file: ArrayBuffer | Blob): Promise<JSZip> {
    try {
      const zip = new JSZip();
      await zip.loadAsync(file);
      return zip;
    } catch (error) {
      throw new Error(`Failed to load ZIP file: ${(error as Error).message}`);
    }
  }

  async extractFile(zip: JSZip, path: string): Promise<string> {
    const file = zip.file(path);
    if (!file) {
      throw new Error(`File not found in ZIP: ${path}`);
    }
    
    try {
      return await file.async('string');
    } catch (error) {
      throw new Error(`Failed to extract file ${path}: ${(error as Error).message}`);
    }
  }

  async extractBinaryFile(zip: JSZip, path: string): Promise<ArrayBuffer> {
    const file = zip.file(path);
    if (!file) {
      throw new Error(`File not found in ZIP: ${path}`);
    }
    
    try {
      return await file.async('arraybuffer');
    } catch (error) {
      throw new Error(`Failed to extract binary file ${path}: ${(error as Error).message}`);
    }
  }

  fileExists(zip: JSZip, path: string): boolean {
    return zip.file(path) !== null;
  }

  listFiles(zip: JSZip, pattern?: RegExp): string[] {
    const files: string[] = [];
    
    zip.forEach((relativePath, file) => {
      if (!file.dir && (!pattern || pattern.test(relativePath))) {
        files.push(relativePath);
      }
    });
    
    return files;
  }

  async getFileInfo(zip: JSZip, path: string): Promise<FileInfo> {
    const file = zip.file(path);
    if (!file) {
      throw new Error(`File not found in ZIP: ${path}`);
    }
    
    return {
      name: file.name,
      size: (file as any)._data ? (file as any)._data.uncompressedSize : 0,
      lastModified: file.date
    };
  }
}