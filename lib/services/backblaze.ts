import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { log } from '@/lib/utils/productionLogger';

// Handle Node.js specific modules in a way that works with Next.js
let https: any;
let httpsAgent: any;

if (typeof window === 'undefined') {
  // This code only runs on the server side
  https = require('https');
  httpsAgent = new https.Agent({
    rejectUnauthorized: true, // Backblaze uses valid certificates
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000, // 60 second timeout
    // Add connection timeout
    connectTimeout: 30000, // 30 seconds to establish connection
  });
}

// Configure AWS SDK for Backblaze B2
const getBackblazeEndpoint = () => {
  // Use B2_ENDPOINT from env if available (most reliable)
  if (process.env.B2_ENDPOINT) {
    return process.env.B2_ENDPOINT;
  }
  
  // Fallback: construct endpoint from region
  const region = process.env.B2_REGION || 'us-east-005';
  return `https://s3.${region}.backblazeb2.com`;
};

// Lazy initialization of S3Client to ensure env vars are available
let s3Client: S3Client | null = null;

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

// Get the S3 client instance
const getS3Client = (): S3Client => {
  if (!s3Client) {
    // In browser, we need to use credentials from the session or API route
    const accessKeyId = isBrowser ? '' : process.env.B2_APPLICATION_KEY_ID;
    const secretAccessKey = isBrowser ? '' : process.env.B2_APPLICATION_KEY;
    
    if (!isBrowser && (!accessKeyId || !secretAccessKey)) {
      log.error('❌ Backblaze B2 credentials not configured');
      throw new Error('Backblaze B2 credentials not configured');
    }
    
    if (!accessKeyId || !secretAccessKey) {
      log.error('❌ Backblaze B2 credentials not configured!');
      log.error('Missing:', {
        hasKeyId: !!accessKeyId,
        hasKey: !!secretAccessKey
      });
      throw new Error('Backblaze B2 credentials not configured. Please set B2_APPLICATION_KEY_ID and B2_APPLICATION_KEY environment variables.');
    }
    
    const endpoint = getBackblazeEndpoint();
    
    const config: S3ClientConfig = {
      endpoint: endpoint,
      region: 'us-east-005', // Must match your B2 region
      forcePathStyle: true, // Required for Backblaze B2
      maxAttempts: 3,
      // Only include credentials if not in browser
      ...(!isBrowser && accessKeyId && secretAccessKey ? {
        credentials: {
          accessKeyId,
          secretAccessKey,
        }
      } : {}),
      // Add custom user agent
      customUserAgent: 'CUBS-Document-Manager/1.0',
    };

    // Note: AWS SDK v3 will use the default Node.js HTTP handler
    // The httpsAgent is configured globally and will be used automatically
    // We don't need to explicitly set requestHandler
    
    log.info('🔧 Backblaze S3 Client Config:', {
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      hasKeyId: !!accessKeyId,
      keyIdLength: accessKeyId?.length || 0,
      bucketName: process.env.B2_BUCKET_NAME,
      env: process.env.NODE_ENV,
      hasHttpsAgent: !!httpsAgent
    });

    s3Client = new S3Client(config);
    log.info('✅ S3Client initialized with Backblaze credentials');
  }
  
  return s3Client;
};

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

    log.info('🔧 Backblaze Configuration:', config);

    // Check for common issues
    if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
      log.error('❌ Missing B2 credentials!');
    }
    if (!process.env.B2_BUCKET_NAME) {
      log.error('❌ Missing B2_BUCKET_NAME!');
    }

    return config;
  }

  // Debug method to test file access
  static async testFileAccess(fileKey: string): Promise<boolean> {
    try {
      log.info('🔍 Testing file access for:', fileKey);

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await getS3Client().send(command);
      log.info('✅ File exists and is accessible');
      return true;
    } catch (error) {
      log.error('❌ File access test failed:', error);
      return false;
    }
  }
  
  // Try different bucket names if the default fails
  private static async tryBucketNames(fileKey: string, expiresIn: number = 3600): Promise<string> {
    const bucketNames = ['cubsdocs', 'cubs', 'cubs-docs', 'cubs_docs', 'documents'];
    
    // Decode URL-encoded characters in the file key
    const decodedFileKey = decodeURIComponent(fileKey);
    log.info('🔄 Trying alternative buckets with decoded fileKey:', decodedFileKey);
    
    for (const bucketName of bucketNames) {
      try {
        log.info(`🔄 Trying bucket: ${bucketName}`);
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: decodedFileKey,
        });
        
        const url = await getSignedUrl(getS3Client(), command, { expiresIn });
        log.info(`✅ Successfully generated signed URL with bucket: ${bucketName}`);
        return url;
      } catch (error) {
        log.info(`❌ Failed with bucket ${bucketName}:`, (error as Error).message);
        log.info(`❌ Full error for ${bucketName}:`, error);
        continue;
      }
    }
    
    log.error('❌ All bucket attempts failed');
    throw new Error('Failed to generate signed URL with any bucket name');
  }

  // Upload file to Backblaze B2
  static async uploadFile(
    file: File,
    metadata: FileMetadata
  ): Promise<UploadResult> {
    const isBrowser = typeof window !== 'undefined';
    
    // In browser, we'll use an API route to handle the upload
    if (isBrowser) {
      try {
        log.info('📤 Starting browser-side upload via API route...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(metadata));
        
        const { getApiUrl } = await import('@/lib/utils/apiClient');
        const response = await fetch(getApiUrl('api/upload'), {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Upload failed');
        }
        
        return await response.json();
      } catch (error) {
        log.error('❌ Browser upload failed:', error);
        throw error;
      }
    }
    
    // Server-side upload (original implementation)
    try {
      const client = getS3Client();
      
      // Validate metadata
      if (!metadata.fileName) {
        throw new Error('File name is required');
      }
      
      // Create a unique key for the file
      const timestamp = Date.now();
      const safeFileName = (metadata.fileName || 'unnamed').replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const key = `${metadata.companyName}/${metadata.employeeName}/${timestamp}_${safeFileName}`;
      
      log.info('📤 Starting file upload to Backblaze B2', {
        bucket: this.bucketName,
        key,
        size: metadata.fileSize,
        type: metadata.mimeType,
        fileName: metadata.fileName
      });

      // Convert File to Buffer for Node.js environment
      let fileBuffer: Buffer;
      try {
        if (file instanceof Buffer) {
          fileBuffer = file;
        } else if (file && typeof (file as any).arrayBuffer === 'function') {
          const arrayBuffer = await (file as any).arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
        } else if (file && typeof (file as any).stream === 'function') {
          // Fallback: use stream if arrayBuffer is not available
          const stream = (file as any).stream();
          const chunks: Uint8Array[] = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
        } else {
          log.error('❌ Unsupported file type:', {
            fileType: typeof file,
            hasArrayBuffer: typeof (file as any)?.arrayBuffer === 'function',
            hasStream: typeof (file as any)?.stream === 'function',
            constructor: file?.constructor?.name
          });
          throw new Error('Unsupported file type: File object does not have arrayBuffer() or stream() method');
        }
      } catch (conversionError) {
        log.error('❌ File conversion error:', conversionError);
        throw new Error(`Failed to convert file to buffer: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
      }

      // Use actual buffer size instead of metadata fileSize to avoid mismatches
      const actualSize = fileBuffer.length;
      
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: metadata.mimeType || 'application/octet-stream',
        ContentLength: actualSize, // Use actual buffer size
        Metadata: {
          'x-amz-meta-company': metadata.companyName,
          'x-amz-meta-employee': metadata.employeeName,
          'x-amz-meta-document-type': metadata.documentType,
        },
      };
      
      // Log size mismatch if any
      if (actualSize !== metadata.fileSize) {
        log.warn('⚠️ File size mismatch:', {
          expected: metadata.fileSize,
          actual: actualSize,
          difference: actualSize - metadata.fileSize
        });
      }

      // Retry logic for connection issues
      const maxRetries = 3;
      let lastError: any = null;
      
      log.info('🔗 Connection details:', {
        endpoint: client.config.endpoint,
        region: client.config.region,
        bucket: this.bucketName,
        key,
        fileSize: fileBuffer.length
      });
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const startTime = Date.now();
        try {
          log.info(`📤 Uploading file to Backblaze... (Attempt ${attempt}/${maxRetries})`, {
            bucket: this.bucketName,
            key,
            size: fileBuffer.length,
            contentType: params.ContentType,
            endpoint: client.config.endpoint
          });
          
          await client.send(new PutObjectCommand(params));
          const duration = Date.now() - startTime;
          
          log.info(`✅ File uploaded to Backblaze successfully in ${duration}ms`);
          break; // Success, exit retry loop
        } catch (error: unknown) {
          const duration = Date.now() - startTime;
          lastError = error;
          const errorInfo: any = {
            duration,
            errorAt: new Date().toISOString(),
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : 'Unknown',
            code: (error as any)?.code,
            errno: (error as any)?.errno,
            syscall: (error as any)?.syscall,
            address: (error as any)?.address,
            port: (error as any)?.port,
            statusCode: (error as any)?.statusCode,
            $metadata: (error as any)?.$metadata,
            stack: error instanceof Error ? error.stack : undefined,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
            cause: (error as any)?.cause ? String((error as any).cause) : undefined
          };
          
          log.error(`❌ Upload attempt ${attempt} failed after ${duration}ms:`, errorInfo);
          
          // Check if it's a connection error that we should retry
          const isRetryableError = 
            errorInfo.code === 'ECONNRESET' ||
            errorInfo.code === 'ETIMEDOUT' ||
            errorInfo.code === 'ENOTFOUND' ||
            errorInfo.code === 'ECONNREFUSED' ||
            errorInfo.code === 'EPIPE' ||
            errorInfo.message?.includes('ECONNRESET') ||
            errorInfo.message?.includes('timeout') ||
            errorInfo.message?.includes('socket hang up') ||
            errorInfo.message?.includes('read ECONNRESET');
          
          if (isRetryableError && attempt < maxRetries) {
            const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
            log.warn(`⚠️ Retryable error detected, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          } else {
            // Not retryable or max retries reached
            log.error('❌ Upload to Backblaze failed (final):', {
              attempt,
              maxRetries,
              error: errorInfo,
              isRetryable: isRetryableError
            });
            throw new Error(`Upload failed: ${errorInfo.message} (code: ${errorInfo.code || 'unknown'})`);
          }
        }
      }
      
      // If we get here without throwing, all retries failed
      if (lastError) {
        const errorInfo = lastError instanceof Error ? {
          message: lastError.message,
          code: (lastError as any).code,
        } : { message: 'Unknown error occurred' };
        throw new Error(`Upload failed after ${maxRetries} attempts: ${errorInfo.message}`);
      }

      // Generate file URL using the correct Backblaze B2 format
      const region = process.env.B2_REGION || 'us-east-005';
      const fileUrl = `https://${this.bucketName}.s3.${region}.backblazeb2.com/${key}`;

      log.info('✅ File uploaded successfully', {
        fileUrl,
        key,
        size: metadata.fileSize
      });

      return {
        success: true,
        fileUrl,
        fileKey: key,
      };
    } catch (error: unknown) {
      let errorMessage = 'Unknown upload error';
      let errorName = 'Error';
      let errorCode: string | number | undefined;
      let statusCode: number | undefined;
      let errorStack: string | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorName = error.name;
        // @ts-ignore - Some errors might have these properties
        errorCode = error.code;
        // @ts-ignore
        statusCode = error.statusCode;
        errorStack = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      if (errorName === 'AbortError') {
        errorMessage = 'Upload timed out after 30 seconds';
      }
      
      log.error('❌ Backblaze upload failed:', {
        error: errorMessage,
        name: errorName,
        code: errorCode,
        statusCode,
        time: new Date().toISOString(),
        stack: errorStack
      });
      
      return {
        success: false,
        error: `Upload failed: ${errorMessage}`,
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

      await getS3Client().send(deleteCommand);

      return {
        success: true,
      };
    } catch (error) {
      log.error('Backblaze delete error:', error);
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
      log.info('🔍 Generating presigned URL for fileKey:', fileKey);
      log.info('🔍 Using bucket:', this.bucketName);
      
      // Decode URL-encoded characters in the file key
      const decodedFileKey = decodeURIComponent(fileKey);
      log.info('🔍 Decoded fileKey:', decodedFileKey);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: decodedFileKey,
      });

      log.info('🔍 Command created, generating signed URL...');
      const signedUrl = await getSignedUrl(getS3Client(), command, { expiresIn });
      log.info('✅ Presigned URL generated successfully');
      return signedUrl;
    } catch (error) {
      log.error('❌ Error generating presigned URL with default bucket:', error);
      log.error('❌ Error details:', {
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

      const result = await getS3Client().send(command);
      return result.Contents || [];
    } catch (error) {
      log.error('Error listing files:', error);
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

      await getS3Client().send(command);
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

      return await getS3Client().send(command);
    } catch (error) {
      log.error('Error getting file metadata:', error);
      return null;
    }
  }
}
