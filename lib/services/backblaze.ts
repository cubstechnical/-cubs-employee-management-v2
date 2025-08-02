import AWS from 'aws-sdk';

// Configure AWS SDK for Backblaze B2
const s3 = new AWS.S3({
  endpoint: process.env.BACKBLAZE_ENDPOINT,
  accessKeyId: process.env.BACKBLAZE_ACCESS_KEY_ID,
  secretAccessKey: process.env.BACKBLAZE_SECRET_ACCESS_KEY,
  region: 'us-west-002', // Backblaze B2 region
  s3ForcePathStyle: true,
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
  private static bucketName = process.env.BACKBLAZE_BUCKET_NAME || 'cubs-documents';

  // Upload file to Backblaze B2
  static async uploadFile(
    file: File,
    metadata: FileMetadata
  ): Promise<UploadResult> {
    try {
      // Generate unique file key
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileKey = `${metadata.companyName}/${metadata.employeeName}/${metadata.documentType}/${timestamp}.${fileExtension}`;

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Backblaze B2
      const uploadParams = {
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
      };

      const result = await s3.upload(uploadParams).promise();

      return {
        success: true,
        fileUrl: result.Location,
        fileKey: result.Key,
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
      const deleteParams = {
        Bucket: this.bucketName,
        Key: fileKey,
      };

      await s3.deleteObject(deleteParams).promise();

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
    return `https://${this.bucketName}.s3.us-west-002.backblazeb2.com/${fileKey}`;
  }

  // Generate presigned URL for secure file access
  static async getPresignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
        Expires: expiresIn,
      };

      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  // List files in a specific folder
  static async listFiles(prefix: string): Promise<AWS.S3.Object[]> {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
      };

      const result = await s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Check if file exists
  static async fileExists(fileKey: string): Promise<boolean> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
      };

      await s3.headObject(params).promise();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get file metadata
  static async getFileMetadata(fileKey: string): Promise<AWS.S3.HeadObjectOutput | null> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
      };

      return await s3.headObject(params).promise();
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }
}

export default BackblazeService; 