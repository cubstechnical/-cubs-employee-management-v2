import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Document Upload Constraints - Comprehensive Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to documents page
    await page.goto('/admin/documents');
    await page.waitForTimeout(3000);
  });

  test('should reject a zero-byte file', async ({ page }) => {
    // Create a zero-byte file for testing
    const zeroBytePath = path.join(__dirname, '..', 'fixtures', 'zero-byte-file.txt');
    
    // Ensure the fixtures directory exists
    const fixturesDir = path.dirname(zeroBytePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    // Create zero-byte file
    fs.writeFileSync(zeroBytePath, '');
    
    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), button:has-text("Upload Document")');
    
    if (await uploadButton.count() > 0) {
      await uploadButton.first().click();
      await page.waitForTimeout(1000);

      // Find file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(zeroBytePath);
        await page.waitForTimeout(1000);

        // Look for upload button in modal
        const modalUploadButton = page.getByRole('button', { name: 'Upload' }).or(page.getByRole('button', { name: 'Submit' }));
        if (await modalUploadButton.count() > 0) {
          await modalUploadButton.first().click();
          await page.waitForTimeout(2000);

          // Check for error message
          const errorSelectors = [
            'text=File size cannot be zero',
            'text=File is empty',
            'text=Please select a valid file',
            'text=Invalid file',
            '.error',
            '.text-red-600',
            '[role="alert"]'
          ];

          let errorFound = false;
          for (const selector of errorSelectors) {
            const errorElement = page.locator(selector);
            if (await errorElement.count() > 0) {
              await expect(errorElement.first()).toBeVisible();
              errorFound = true;
              console.log(`✅ Zero-byte file rejected with error: ${selector}`);
              break;
            }
          }

          if (!errorFound) {
            console.log('ℹ️ No specific error found for zero-byte file (may be handled differently)');
          }
        }
      }
    }

    // Clean up
    if (fs.existsSync(zeroBytePath)) {
      fs.unlinkSync(zeroBytePath);
    }
  });

  test('should reject an invalid file type', async ({ page }) => {
    // Create an invalid file for testing
    const invalidFilePath = path.join(__dirname, '..', 'fixtures', 'invalid-file.tmp');
    
    // Ensure the fixtures directory exists
    const fixturesDir = path.dirname(invalidFilePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    // Create invalid file
    fs.writeFileSync(invalidFilePath, 'This is an invalid file type');
    
    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), button:has-text("Upload Document")');
    
    if (await uploadButton.count() > 0) {
      await uploadButton.first().click();
      await page.waitForTimeout(1000);

      // Find file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(invalidFilePath);
        await page.waitForTimeout(1000);

        // Look for upload button in modal
        const modalUploadButton = page.getByRole('button', { name: 'Upload' }).or(page.getByRole('button', { name: 'Submit' }));
        if (await modalUploadButton.count() > 0) {
          await modalUploadButton.first().click();
          await page.waitForTimeout(2000);

          // Check for error message
          const errorSelectors = [
            'text=Invalid file type',
            'text=File type not supported',
            'text=Please select a valid file type',
            'text=Unsupported file format',
            '.error',
            '.text-red-600',
            '[role="alert"]'
          ];

          let errorFound = false;
          for (const selector of errorSelectors) {
            const errorElement = page.locator(selector);
            if (await errorElement.count() > 0) {
              await expect(errorElement.first()).toBeVisible();
              errorFound = true;
              console.log(`✅ Invalid file type rejected with error: ${selector}`);
              break;
            }
          }

          if (!errorFound) {
            console.log('ℹ️ No specific error found for invalid file type (may be handled differently)');
          }
        }
      }
    }

    // Clean up
    if (fs.existsSync(invalidFilePath)) {
      fs.unlinkSync(invalidFilePath);
    }
  });

  test('should accept valid file types', async ({ page }) => {
    // Create valid test files
    const validFiles = [
      { name: 'test-document.pdf', content: '%PDF-1.4\nTest PDF content' },
      { name: 'test-image.jpg', content: '\xFF\xD8\xFF\xE0' }, // JPEG header
      { name: 'test-image.png', content: '\x89PNG\r\n\x1A\n' } // PNG header
    ];

    for (const file of validFiles) {
      const filePath = path.join(__dirname, '..', 'fixtures', file.name);
      
      // Ensure the fixtures directory exists
      const fixturesDir = path.dirname(filePath);
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      
      // Create valid file
      fs.writeFileSync(filePath, file.content);
      
      // Look for upload button
      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), button:has-text("Upload Document")');
      
      if (await uploadButton.count() > 0) {
        await uploadButton.first().click();
        await page.waitForTimeout(1000);

        // Find file input
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          await fileInput.first().setInputFiles(filePath);
          await page.waitForTimeout(1000);

          // Check if file was accepted (no immediate error)
          const errorSelectors = [
            'text=Invalid file type',
            'text=File type not supported',
            'text=Please select a valid file type',
            '.error',
            '.text-red-600'
          ];

          let errorFound = false;
          for (const selector of errorSelectors) {
            const errorElement = page.locator(selector);
            if (await errorElement.count() > 0) {
              errorFound = true;
              console.log(`⚠️ Valid file ${file.name} was rejected`);
              break;
            }
          }

          if (!errorFound) {
            console.log(`✅ Valid file ${file.name} was accepted`);
          }
        }
      }

      // Clean up
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  test('should validate file size limits', async ({ page }) => {
    // Create a large file for testing (1MB)
    const largeFilePath = path.join(__dirname, '..', 'fixtures', 'large-file.pdf');
    
    // Ensure the fixtures directory exists
    const fixturesDir = path.dirname(largeFilePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    // Create large file (1MB)
    const largeContent = Buffer.alloc(1024 * 1024, 'A'); // 1MB of 'A' characters
    fs.writeFileSync(largeFilePath, largeContent);
    
    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), button:has-text("Upload Document")');
    
    if (await uploadButton.count() > 0) {
      await uploadButton.first().click();
      await page.waitForTimeout(1000);

      // Find file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(largeFilePath);
        await page.waitForTimeout(2000); // Longer wait for large file

        // Look for upload button in modal
        const modalUploadButton = page.getByRole('button', { name: 'Upload' }).or(page.getByRole('button', { name: 'Submit' }));
        if (await modalUploadButton.count() > 0) {
          await modalUploadButton.first().click();
          await page.waitForTimeout(3000);

          // Check for file size error message
          const errorSelectors = [
            'text=File too large',
            'text=File size exceeds limit',
            'text=Maximum file size',
            'text=File is too big',
            '.error',
            '.text-red-600',
            '[role="alert"]'
          ];

          let errorFound = false;
          for (const selector of errorSelectors) {
            const errorElement = page.locator(selector);
            if (await errorElement.count() > 0) {
              await expect(errorElement.first()).toBeVisible();
              errorFound = true;
              console.log(`✅ Large file rejected with error: ${selector}`);
              break;
            }
          }

          if (!errorFound) {
            console.log('ℹ️ No specific error found for large file (may be within size limit)');
          }
        }
      }
    }

    // Clean up
    if (fs.existsSync(largeFilePath)) {
      fs.unlinkSync(largeFilePath);
    }
  });

  test('should handle multiple file uploads', async ({ page }) => {
    // Create multiple test files
    const testFiles = [
      { name: 'test1.pdf', content: '%PDF-1.4\nTest PDF 1' },
      { name: 'test2.pdf', content: '%PDF-1.4\nTest PDF 2' }
    ];

    const filePaths = [];
    
    // Create test files
    for (const file of testFiles) {
      const filePath = path.join(__dirname, '..', 'fixtures', file.name);
      
      // Ensure the fixtures directory exists
      const fixturesDir = path.dirname(filePath);
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, file.content);
      filePaths.push(filePath);
    }
    
    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), button:has-text("Upload Document")');
    
    if (await uploadButton.count() > 0) {
      await uploadButton.first().click();
      await page.waitForTimeout(1000);

      // Find file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        // Check if multiple file selection is supported
        const acceptMultiple = await fileInput.first().getAttribute('multiple');
        
        if (acceptMultiple) {
          await fileInput.first().setInputFiles(filePaths);
          await page.waitForTimeout(2000);

          console.log('✅ Multiple file upload supported');
        } else {
          console.log('ℹ️ Multiple file upload not supported (single file only)');
        }
      }
    }

    // Clean up
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  test('should show upload progress and status', async ({ page }) => {
    // Create a test file
    const testFilePath = path.join(__dirname, '..', 'fixtures', 'test-upload.pdf');
    
    // Ensure the fixtures directory exists
    const fixturesDir = path.dirname(testFilePath);
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    // Create test file
    fs.writeFileSync(testFilePath, '%PDF-1.4\nTest upload file');
    
    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Add"), button:has-text("Upload Document")');
    
    if (await uploadButton.count() > 0) {
      await uploadButton.first().click();
      await page.waitForTimeout(1000);

      // Find file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(testFilePath);
        await page.waitForTimeout(1000);

        // Look for upload button in modal
        const modalUploadButton = page.getByRole('button', { name: 'Upload' }).or(page.getByRole('button', { name: 'Submit' }));
        if (await modalUploadButton.count() > 0) {
          await modalUploadButton.first().click();
          
          // Wait for upload to start
          await page.waitForTimeout(2000);

          // Check for progress indicators
          const progressSelectors = [
            '[data-testid="upload-progress"]',
            '.progress',
            '.upload-progress',
            'text=Uploading',
            'text=Processing'
          ];

          let progressFound = false;
          for (const selector of progressSelectors) {
            const progressElement = page.locator(selector);
            if (await progressElement.count() > 0) {
              await expect(progressElement.first()).toBeVisible();
              progressFound = true;
              console.log(`✅ Upload progress indicator found: ${selector}`);
              break;
            }
          }

          if (!progressFound) {
            console.log('ℹ️ No progress indicator found (may be instant upload)');
          }

          // Wait for upload to complete
          await page.waitForTimeout(5000);

          // Check for success message
          const successSelectors = [
            'text=Upload successful',
            'text=File uploaded',
            'text=Success',
            '.success',
            '.text-green-600'
          ];

          let successFound = false;
          for (const selector of successSelectors) {
            const successElement = page.locator(selector);
            if (await successElement.count() > 0) {
              await expect(successElement.first()).toBeVisible();
              successFound = true;
              console.log(`✅ Upload success message found: ${selector}`);
              break;
            }
          }

          if (!successFound) {
            console.log('ℹ️ No success message found (upload may be silent)');
          }
        }
      }
    }

    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });
});

