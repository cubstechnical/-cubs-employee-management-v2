import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// Avoid importing Node https in edge/browser contexts. Use dynamic require in Node only.
let httpsAgent: any = undefined;
try {
  // const https = require('https');
// httpsAgent = new https.Agent({ rejectUnauthorized: false });
} catch {}

// Configure AWS SDK for Backblaze B2
const getBackblazeEndpoint = () => {
  const endpoint = process.env.B2_ENDPOINT || 's3.us-east-005.backblazeb2.com';
  // Ensure the endpoint starts with https://
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return `https://${endpoint}`;
};

const s3Client = new S3Client({
  endpoint: getBackblazeEndpoint(),
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID || '',
    secretAccessKey: process.env.B2_APPLICATION_KEY || '',
  },
  region: 'us-east-005', // Backblaze B2 region
  forcePathStyle: true,
  // Add SSL certificate handling for development
  ...(process.env.NODE_ENV === 'development' && httpsAgent
    ? { requestHandler: { httpsAgent } }
    : {})
});

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileKey?: string;
  error?: string;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  companyName: string;
  employeeName: string;
  documentType: string;
}

export class BackblazeService {
  private static bucketName = process.env.B2_BUCKET_NAME || 'cubsdocs';
  
  private static normalizeCompanyFolderName(companyName: string): string {
    if (!companyName) return 'Unknown';
    const trimmed = companyName.trim();
    // Map display names to canonical Backblaze prefixes used historically
    const map: Record<string, string> = {
      // Canonicalize to the '&' variant for all future uploads
      'AL HANA TOURS & TRAVELS': 'AL HANA TOURS & TRAVELS',
      'AL HANA TOURS AND TRAVELS': 'AL HANA TOURS & TRAVELS',
      'AL HANA TOURS and TRAVELS': 'AL HANA TOURS & TRAVELS',
      'GOLDEN CUBS': 'GOLDEN_CUBS',
      'FLUID ENGINEERING': 'FLUID_ENGINEERING',
      'CUBS TECH': 'CUBS',
    };
    return map[trimmed] || trimmed;
  }
  
  // Debug method to check configuration
  static getConfig() {
    const config = {
      bucketName: this.bucketName,
      endpoint: process.env.B2_ENDPOINT,
      actualEndpoint: getBackblazeEndpoint(),
      hasKeyId: !!process.env.B2_APPLICATION_KEY_ID,
      hasKey: !!process.env.B2_APPLICATION_KEY,
      keyIdLength: process.env.B2_APPLICATION_KEY_ID?.length || 0,
      keyLength: process.env.B2_APPLICATION_KEY?.length || 0
    };

    console.log('🔧 Backblaze Configuration:', config);

    // Check for common issues
    if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
      console.error('❌ Missing B2 credentials!');
    }
    if (!process.env.B2_BUCKET_NAME) {
      console.error('❌ Missing B2_BUCKET_NAME!');
    }

    return config;
  }

  // Debug method to test file access
  static async testFileAccess(fileKey: string): Promise<boolean> {
    try {
      console.log('🔍 Testing file access for:', fileKey);

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await s3Client.send(command);
      console.log('✅ File exists and is accessible');
      return true;
    } catch (error) {
      console.error('❌ File access test failed:', error);
      return false;
    }
  }
  
  // Try different bucket names if the default fails
  private static async tryBucketNames(fileKey: string, expiresIn: number = 3600): Promise<string> {
    const bucketNames = ['cubsdocs', 'cubs', 'cubs-docs', 'cubs_docs', 'documents'];
    
    // Decode URL-encoded characters in the file key
    const decodedFileKey = decodeURIComponent(fileKey);
    console.log('🔄 Trying alternative buckets with decoded fileKey:', decodedFileKey);
    
    for (const bucketName of bucketNames) {
      try {
        console.log(`🔄 Trying bucket: ${bucketName}`);
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: decodedFileKey,
        });
        
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        console.log(`✅ Successfully generated signed URL with bucket: ${bucketName}`);
        return url;
      } catch (error) {
        console.log(`❌ Failed with bucket ${bucketName}:`, (error as Error).message);
        console.log(`❌ Full error for ${bucketName}:`, error);
        continue;
      }
    }
    
    console.error('❌ All bucket attempts failed');
    throw new Error('Failed to generate signed URL with any bucket name');
  }

  // Upload file to Backblaze B2
  static async uploadFile(
    file: File,
    metadata: FileMetadata
  ): Promise<UploadResult> {
    try {
      // Normalize company folder name to match existing Backblaze prefixes
      const normalizedCompany = this.normalizeCompanyFolderName(metadata.companyName);

      // Generate user-friendly file key with original filename
      const fileKey = metadata.employeeName 
        ? `${normalizedCompany}/${metadata.employeeName}/${file.name}`
        : `${normalizedCompany}/${file.name}`;

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Backblaze B2
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          companyName: metadata.companyName,
          employeeName: metadata.employeeName,
          documentType: metadata.documentType,
          uploadedAt: new Date().toISOString(),
        },
      });

      const result = await s3Client.send(uploadCommand);

      return {
        success: true,
        fileUrl: `https://f005.backblazeb2.com/file/${this.bucketName}/${fileKey}`,
        fileKey: fileKey,
      };
    } catch (error) {
      console.error('Backblaze upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Delete file from Backblaze B2
  static async deleteFile(fileKey: string): Promise<UploadResult> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await s3Client.send(deleteCommand);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Backblaze delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  // Get file URL (for viewing/downloading)
  static getFileUrl(fileKey: string): string {
    return `https://f005.backblazeb2.com/file/${this.bucketName}/${fileKey}`;
  }

  // Generate presigned URL for secure file access
  static async getPresignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      console.log('🔍 Generating presigned URL for fileKey:', fileKey);
      console.log('🔍 Using bucket:', this.bucketName);
      
      // Decode URL-encoded characters in the file key
      const decodedFileKey = decodeURIComponent(fileKey);
      console.log('🔍 Decoded fileKey:', decodedFileKey);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: decodedFileKey,
      });

      console.log('🔍 Command created, generating signed URL...');
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      console.log('✅ Presigned URL generated successfully');
      return signedUrl;
    } catch (error) {
      console.error('❌ Error generating presigned URL with default bucket:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      // Try alternative bucket names
      return await this.tryBucketNames(fileKey, expiresIn);
    }
  }

  // Get direct file URL (fallback when presigned URLs fail)
  static getDirectFileUrl(fileKey: string): string {
    // Use the public URL format for Backblaze B2
    return `https://f005.backblazeb2.com/file/${this.bucketName}/${fileKey}`;
  }

  // List files in a specific folder
  static async listFiles(prefix: string): Promise<any[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const result = await s3Client.send(command);
      return result.Contents || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Check if file exists
  static async fileExists(fileKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get file metadata
  static async getFileMetadata(fileKey: string): Promise<any | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      return await s3Client.send(command);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }
}
