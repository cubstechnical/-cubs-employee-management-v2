// import AWS from 'aws-sdk'; // Temporarily disabled due to missing types

const b2Config = {
  accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
  secretAccessKey: process.env.B2_APPLICATION_KEY!,
  endpoint: process.env.B2_ENDPOINT!,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
};

// export const b2Client = new AWS.S3(b2Config); // Temporarily disabled
export const b2Client: any = null; // Placeholder until AWS SDK is properly configured

export const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME!;

export const uploadToB2 = async (
  file: File,
  key: string,
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
): Promise<string> => {
  if (!b2Client) {
    throw new Error('B2 client not configured');
  }
  
  const params = {
    Bucket: B2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: file.type,
  };

  return new Promise((resolve, reject) => {
    const upload = b2Client.upload(params);

    upload.on('httpUploadProgress', (progress: any) => {
      if (onProgress) {
        onProgress({
          loaded: progress.loaded,
          total: progress.total,
          percentage: Math.round((progress.loaded / progress.total) * 100),
        });
      }
    });

    upload.send((err: any, data: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
};

export const deleteFromB2 = async (key: string): Promise<void> => {
  if (!b2Client) {
    throw new Error('B2 client not configured');
  }
  
  const params = {
    Bucket: B2_BUCKET_NAME,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    b2Client.deleteObject(params, (err: any, data: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const getSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  if (!b2Client) {
    throw new Error('B2 client not configured');
  }
  
  const params = {
    Bucket: B2_BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };

  return new Promise((resolve, reject) => {
    b2Client.getSignedUrl('getObject', params, (err: any, url: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
};

export const listFiles = async (prefix?: string): Promise<any[]> => {
  if (!b2Client) {
    throw new Error('B2 client not configured');
  }
  const params: any = {
    Bucket: B2_BUCKET_NAME,
  };

  if (prefix) {
    params.Prefix = prefix;
  }

  return new Promise((resolve, reject) => {
    b2Client.listObjectsV2(params, (err: any, data: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Contents || []);
      }
    });
  });
};
