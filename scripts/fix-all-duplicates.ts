#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  path: string;
  hasDuplication: boolean;
  duplicationStartLine?: number;
}

class DuplicationFixer {
  private targetDirectories = [
    'app',
    'components', 
    'lib',
    'utils',
    'types'
  ];

  private fileExtensions = ['.ts', '.tsx'];

  /**
   * Main execution method
   */
  async execute(): Promise<void> {
    console.log('🚀 Starting Definitive Duplication Recovery...\n');
    
    try {
      // Pass 1: Identify all corrupted files
      console.log('📋 Pass 1: Identifying corrupted files...');
      const corruptedFiles = await this.identifyCorruptedFiles();
      
      if (corruptedFiles.length === 0) {
        console.log('✅ No corrupted files found. Project is clean!');
        return;
      }

      console.log(`🔍 Found ${corruptedFiles.length} files with duplication issues:\n`);
      corruptedFiles.forEach(file => {
        console.log(`  - ${file.path} (duplication starts at line ${file.duplicationStartLine})`);
      });

      // Pass 2: Fix each corrupted file
      console.log('\n🔧 Pass 2: Surgically fixing corrupted files...\n');
      await this.fixCorruptedFiles(corruptedFiles);

      console.log('\n✅ Recovery completed successfully!');
      console.log(`📊 Fixed ${corruptedFiles.length} files`);

    } catch (error) {
      console.error('❌ Recovery failed:', error);
      process.exit(1);
    }
  }

  /**
   * Pass 1: Identify all files with duplication issues
   */
  private async identifyCorruptedFiles(): Promise<FileInfo[]> {
    const corruptedFiles: FileInfo[] = [];

    for (const dir of this.targetDirectories) {
      if (fs.existsSync(dir)) {
        const files = this.getAllFiles(dir);
        
        for (const filePath of files) {
          if (this.fileExtensions.some(ext => filePath.endsWith(ext))) {
            const fileInfo = await this.analyzeFile(filePath);
            if (fileInfo.hasDuplication) {
              corruptedFiles.push(fileInfo);
            }
          }
        }
      }
    }

    return corruptedFiles;
  }

  /**
   * Get all files recursively from a directory
   */
  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Analyze a single file for duplication issues with robust detection
   */
  private async analyzeFile(filePath: string): Promise<FileInfo> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      if (lines.length < 10) {
        return { path: filePath, hasDuplication: false };
      }

      // Look for multiple export default statements
      const exportDefaultLines = this.findExportDefaultLines(lines);
      if (exportDefaultLines.length > 1) {
        return {
          path: filePath,
          hasDuplication: true,
          duplicationStartLine: exportDefaultLines[1]
        };
      }

      // Look for duplicate import statements
      const importLines = this.findDuplicateImports(lines);
      if (importLines.length > 0) {
        return {
          path: filePath,
          hasDuplication: true,
          duplicationStartLine: importLines[0]
        };
      }

      // Look for duplicate interface/class declarations
      const duplicateDeclarations = this.findDuplicateDeclarations(lines);
      if (duplicateDeclarations.length > 0) {
        return {
          path: filePath,
          hasDuplication: true,
          duplicationStartLine: duplicateDeclarations[0]
        };
      }

      // Look for React component patterns
      const componentPatterns = this.findComponentPatterns(lines);
      if (componentPatterns.length > 1) {
        return {
          path: filePath,
          hasDuplication: true,
          duplicationStartLine: componentPatterns[1]
        };
      }

      // Look for duplicate variable/const declarations
      const duplicateVariables = this.findDuplicateVariables(lines);
      if (duplicateVariables.length > 0) {
        return {
          path: filePath,
          hasDuplication: true,
          duplicationStartLine: duplicateVariables[0]
        };
      }

      return { path: filePath, hasDuplication: false };

    } catch (error) {
      console.warn(`⚠️  Warning: Could not analyze ${filePath}:`, error);
      return { path: filePath, hasDuplication: false };
    }
  }

  /**
   * Find lines with export default statements
   */
  private findExportDefaultLines(lines: string[]): number[] {
    const exportDefaultLines: number[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('export default')) {
        exportDefaultLines.push(i);
      }
    }
    
    return exportDefaultLines;
  }

  /**
   * Find duplicate import statements
   */
  private findDuplicateImports(lines: string[]): number[] {
    const importLines: number[] = [];
    const seenImports = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ')) {
        if (seenImports.has(line)) {
          importLines.push(i);
        } else {
          seenImports.add(line);
        }
      }
    }
    
    return importLines;
  }

  /**
   * Find duplicate interface/class declarations
   */
  private findDuplicateDeclarations(lines: string[]): number[] {
    const duplicateLines: number[] = [];
    const seenDeclarations = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('interface ') || line.startsWith('class ') || line.startsWith('export class ') || line.startsWith('export interface ')) {
        const declarationName = this.extractDeclarationName(line);
        if (declarationName && seenDeclarations.has(declarationName)) {
          duplicateLines.push(i);
        } else if (declarationName) {
          seenDeclarations.add(declarationName);
        }
      }
    }
    
    return duplicateLines;
  }

  /**
   * Find React component patterns
   */
  private findComponentPatterns(lines: string[]): number[] {
    const componentLines: number[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Match various React component patterns
      if (
        line.match(/^export default function [A-Z]/) ||
        line.match(/^function [A-Z]/) ||
        line.match(/^const [A-Z].* = \(\) => \{/) ||
        line.match(/^const [A-Z].* = \(.*\) => \{/) ||
        line.match(/^export default \(\) => \{/)
      ) {
        componentLines.push(i);
      }
    }
    
    return componentLines;
  }

  /**
   * Find duplicate variable/const declarations
   */
  private findDuplicateVariables(lines: string[]): number[] {
    const duplicateLines: number[] = [];
    const seenVariables = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('const ') || line.startsWith('let ') || line.startsWith('var ')) {
        const varName = this.extractVariableName(line);
        if (varName && seenVariables.has(varName)) {
          duplicateLines.push(i);
        } else if (varName) {
          seenVariables.add(varName);
        }
      }
    }
    
    return duplicateLines;
  }

  /**
   * Extract declaration name from a line
   */
  private extractDeclarationName(line: string): string | null {
    const match = line.match(/(?:interface|class)\s+(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract variable name from a line
   */
  private extractVariableName(line: string): string | null {
    const match = line.match(/(?:const|let|var)\s+(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * Pass 2: Fix all corrupted files
   */
  private async fixCorruptedFiles(corruptedFiles: FileInfo[]): Promise<void> {
    for (const fileInfo of corruptedFiles) {
      try {
        await this.fixSingleFile(fileInfo);
        console.log(`✅ Fixed: ${fileInfo.path}`);
      } catch (error) {
        console.error(`❌ Failed to fix ${fileInfo.path}:`, error);
      }
    }
  }

  /**
   * Fix a single file by removing duplicated content
   */
  private async fixSingleFile(fileInfo: FileInfo): Promise<void> {
    const { path: filePath, duplicationStartLine } = fileInfo;
    
    if (!duplicationStartLine) {
      throw new Error('No duplication start line provided');
    }

    // Read the file content
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Keep only the content before duplication starts
    const cleanLines = lines.slice(0, duplicationStartLine);
    
    // Join lines back together, preserving original line endings
    const cleanContent = cleanLines.join('\n');

    // Write the cleaned content back to the file
    fs.writeFileSync(filePath, cleanContent, 'utf-8');
  }
}

// Execute the recovery
async function main() {
  const fixer = new DuplicationFixer();
  await fixer.execute();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
} 