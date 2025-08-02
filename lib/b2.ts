import AWS from 'aws-sdk';

const b2Config = {
  accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
  secretAccessKey: process.env.B2_APPLICATION_KEY!,
  endpoint: process.env.B2_ENDPOINT!,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
};

export const b2Client = new AWS.S3(b2Config);

export const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME!;

export const uploadToB2 = async (
  file: File,
  key: string,
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
): Promise<string> => {
  const params = {
    Bucket: B2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: file.type,
  };

  return new Promise((resolve, reject) => {
    const upload = b2Client.upload(params);

    upload.on('httpUploadProgress', (progress) => {
      if (onProgress) {
        onProgress({
          loaded: progress.loaded,
          total: progress.total,
          percentage: Math.round((progress.loaded / progress.total) * 100),
        });
      }
    });

    upload.send((err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
};

export const deleteFromB2 = async (key: string): Promise<void> => {
  const params = {
    Bucket: B2_BUCKET_NAME,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    b2Client.deleteObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const getSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const params = {
    Bucket: B2_BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };

  return new Promise((resolve, reject) => {
    b2Client.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
};

export const listFiles = async (prefix?: string): Promise<AWS.S3.Object[]> => {
  const params: AWS.S3.ListObjectsV2Request = {
    Bucket: B2_BUCKET_NAME,
  };

  if (prefix) {
    params.Prefix = prefix;
  }

  return new Promise((resolve, reject) => {
    b2Client.listObjectsV2(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Contents || []);
      }
    });
  });
};
