# File Upload ECONNRESET Debugging Checklist

## 🔍 TOP 3 LIKELY CAUSES

- [ ] **AWS SDK v3 not using custom HTTPS agent** - The `httpsAgent` is created but AWS SDK v3's default handler may not use it, causing connection resets
- [ ] **Backblaze endpoint/SSL handshake failure** - The endpoint URL format or SSL certificate validation is failing during connection establishment
- [ ] **File buffer size mismatch or streaming issue** - The ContentLength header doesn't match actual buffer size, causing Backblaze to reset the connection mid-upload

---

## 🧪 TERMINAL COMMANDS TO RUN

### Command 1: Test Backblaze endpoint connectivity
```powershell
curl -v -X HEAD "https://s3.us-east-005.backblazeb2.com/cubsdocs" -H "Authorization: AWS 005777f1de8041c0000000001:$(echo -n 'HEAD\n\n\n\n/cubsdocs' | openssl dgst -sha1 -hmac 'K005atrNvhb2raSkcqcpIAM6PsbUPco' -binary | base64)"
```

### Command 2: Verify environment variables are loaded in Node.js
```powershell
node -e "require('dotenv').config(); console.log('B2_ENDPOINT:', process.env.B2_ENDPOINT); console.log('B2_APPLICATION_KEY_ID:', process.env.B2_APPLICATION_KEY_ID ? 'SET (' + process.env.B2_APPLICATION_KEY_ID.length + ' chars)' : 'NOT SET'); console.log('B2_APPLICATION_KEY:', process.env.B2_APPLICATION_KEY ? 'SET (' + process.env.B2_APPLICATION_KEY.length + ' chars)' : 'NOT SET'); console.log('B2_BUCKET_NAME:', process.env.B2_BUCKET_NAME);"
```

### Command 3: Test minimal S3 upload script (isolate AWS SDK)
```powershell
node -e "const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); const https = require('https'); const agent = new https.Agent({ rejectUnauthorized: true, keepAlive: true, timeout: 60000 }); const client = new S3Client({ endpoint: 'https://s3.us-east-005.backblazeb2.com', region: 'us-east-005', forcePathStyle: true, credentials: { accessKeyId: process.env.B2_APPLICATION_KEY_ID, secretAccessKey: process.env.B2_APPLICATION_KEY }, requestHandler: { httpsAgent: agent } }); const testBuffer = Buffer.from('test'); client.send(new PutObjectCommand({ Bucket: 'cubsdocs', Key: 'test-upload.txt', Body: testBuffer, ContentLength: testBuffer.length })).then(() => console.log('✅ Upload success')).catch(err => console.error('❌ Upload failed:', err.message, err.code, err.stack));"
```

### Command 4: Check server logs during upload attempt
```powershell
# In your Next.js dev server terminal, filter for upload-related logs:
# Look for: "📤", "❌", "ECONNRESET", "Backblaze"
```

---

## 🔧 MINIMAL CODE CHANGES FOR FULL STACK TRACE

### Change 1: Add error stack trace capture in `lib/services/backblaze.ts` (line ~350)
```typescript
} catch (error: unknown) {
  lastError = error;
  const errorInfo: any = {
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
    // ADD THIS:
    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    cause: (error as any)?.cause ? String((error as any).cause) : undefined
  };
```

### Change 2: Add timing wrapper in `lib/services/backblaze.ts` (line ~343)
```typescript
const startTime = Date.now();
try {
  await client.send(new PutObjectCommand(params));
  const duration = Date.now() - startTime;
  log.info(`✅ File uploaded to Backblaze successfully in ${duration}ms`);
  break;
} catch (error: unknown) {
  const duration = Date.now() - startTime;
  // ADD THIS:
  log.error(`❌ Upload failed after ${duration}ms:`, {
    duration,
    errorAt: new Date().toISOString(),
    // ... rest of errorInfo
  });
```

### Change 3: Add request/response logging in `app/api/documents/upload/route.ts` (line ~109)
```typescript
log.info('📤 Calling BackblazeService.uploadFile...');
const uploadStartTime = Date.now();
try {
  uploadResult = await BackblazeService.uploadFile(file, {
    // ... existing params
  });
  const uploadDuration = Date.now() - uploadStartTime;
  log.info(`📥 BackblazeService.uploadFile completed in ${uploadDuration}ms:`, {
    // ADD THIS:
    duration: uploadDuration,
    timestamp: new Date().toISOString(),
    success: uploadResult?.success,
    // ... rest
  });
} catch (uploadError) {
  const uploadDuration = Date.now() - uploadStartTime;
  // ADD THIS:
  log.error(`❌ Upload exception after ${uploadDuration}ms:`, {
    duration: uploadDuration,
    timestamp: new Date().toISOString(),
    // ... existing errorDetails
  });
```

---

## 🛡️ SAFE TEMPORARY MITIGATION

### Add graceful degradation in `app/api/documents/upload/route.ts` (after line ~143)
```typescript
} catch (uploadError) {
  const errorDetails = {
    // ... existing errorDetails
  };
  log.error('❌ Backblaze upload exception:', errorDetails);
  
  // ADD THIS MITIGATION:
  // Return a user-friendly error with retry suggestion
  const isConnectionError = 
    errorDetails.code === 'ECONNRESET' ||
    errorDetails.code === 'ETIMEDOUT' ||
    errorDetails.message?.includes('ECONNRESET');
  
  return NextResponse.json(
    { 
      error: isConnectionError 
        ? 'Upload failed due to connection issue. Please try again in a moment.'
        : uploadError instanceof Error ? uploadError.message : 'Failed to upload file to Backblaze',
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      retryable: isConnectionError,
      suggestion: isConnectionError ? 'This is usually temporary. Please retry the upload.' : undefined
    },
    { status: 500 }
  );
}
```

---

## 📋 EXECUTION ORDER

1. Run Command 1 to verify Backblaze endpoint is reachable
2. Run Command 2 to confirm env vars are loaded correctly
3. Apply Change 1, 2, 3 to add full stack traces and timing
4. Apply the mitigation code to prevent user crashes
5. Run Command 3 to test AWS SDK in isolation
6. Attempt upload and check Command 4 (server logs)
7. Review stack traces and timing to identify root cause

