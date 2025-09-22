// @ts-nocheck
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Declare Deno for TypeScript compatibility
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};

// Define auth cache interface
interface AuthCache {
  data: any;
  bucketId: string;
  expiresAt: number;
}

// Cache for Backblaze auth to reduce API calls
let authCache: AuthCache | null = null;

// Helper function to calculate SHA1 hash
async function calculateSHA1(data) {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b)=>b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Get or refresh Backblaze authentication
async function getBackblazeAuth() {
  const now = Date.now();
  // Check if we have valid cached auth (expires after 23 hours)
  if (authCache && authCache.expiresAt > now) {
    return {
      authData: authCache.data,
      bucketId: authCache.bucketId
    };
  }

  
  // Use environment variables - no fallback hardcoded values
  const applicationKeyId = Deno.env.get('B2_APPLICATION_KEY_ID');
  const applicationKey = Deno.env.get('B2_APPLICATION_KEY');
  const bucketName = Deno.env.get('B2_BUCKET_NAME');
  
  if (!applicationKeyId || !applicationKey) {
    throw new Error('B2 credentials not configured');
  }

  // Authenticate with retry logic
  const authData = await retryWithBackoff(async ()=>{
    const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${applicationKeyId}:${applicationKey}`)}`
      }
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`Backblaze auth failed: ${authResponse.status} ${errorText}`);
    }

    return await authResponse.json();
  });

  // Get bucket ID with retry logic
  const bucketId = await retryWithBackoff(async ()=>{
    const bucketsResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: {
        'Authorization': authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: authData.accountId
      })
    });

    if (!bucketsResponse.ok) {
      const errorText = await bucketsResponse.text();
      throw new Error(`Failed to list buckets: ${bucketsResponse.status} ${errorText}`);
    }

    const bucketsData = await bucketsResponse.json();
    const bucket = bucketsData.buckets.find((b)=>b.bucketName === bucketName);

    if (!bucket) {
      throw new Error(`Bucket ${bucketName} not found`);
    }

    return bucket.bucketId;
  });

  // Cache the auth for 23 hours
  authCache = {
    data: authData,
    bucketId: bucketId,
    expiresAt: now + (23 * 60 * 60 * 1000) // 23 hours
  };

  return { authData, bucketId };
}

// Helper function to verify employee exists and get their info
async function verifyEmployee(supabaseClient, employeeIdString) {
  // Normalize ID (trim whitespace)
  employeeIdString = employeeIdString?.toString().trim();
  
  try {
    // Simple lookup using employee_id directly
    const { data: employee, error } = await supabaseClient
      .from('employee_table')
      .select('employee_id, name, eid')
      .eq('employee_id', employeeIdString)
      .single();

    if (error || !employee) {
      
      // Try case-insensitive search
      const { data: employeeCaseInsensitive, error: caseError } = await supabaseClient
        .ilike('employee_id', employeeIdString)
        .single();
      
      if (caseError || !employeeCaseInsensitive) {
        throw new Error(`Employee not found with ID: ${employeeIdString}`);
      }
      
      return employeeCaseInsensitive;
    }

    return employee;
  } catch (error) {
    throw error;
  }
}

// Helper function to get employee UUID from string ID
async function getEmployeeUUID(supabaseClient, employeeIdString) {
      .select('eid, name')

    if (error || !employee) {
      return null;
    }

    
    // Validate that the UUID looks reasonable (should be proper UUID format)
    if (!employee.eid || employee.eid.length < 30 || !employee.eid.includes('-')) {
      // Generate a new UUID for this employee
      const newUUID = crypto.randomUUID();
      
      // Update the employee with the new UUID
      const { error: updateError } = await supabaseClient
        .from('employee_table')
        .update({ eid: newUUID })
        .eq('employee_id', employeeIdString);
      
      if (updateError) {
        return null;
      }
      
      return newUUID;
    }
    
    return employee.eid;
  }
}

serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') }
        }
      }
    );

    // Get the user from the request if available
    let user: any = null;
    
    try {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      if (authError) {
        }
      if (authUser) {
        user = authUser;
      } else {
      }
    } catch (authError) {
      }

    const { action, empId, fileName, fileContent, fileData, contentType, folderName, employeeId, documentType, targetType, companyName, filePath: directFilePath, filePath: explicitFilePath, oldFileName, newFileName } = await req.json();
    
    // Handle both empId and employeeId for backward compatibility
    const actualEmpId = empId || employeeId;
    

    // Validate required fields for upload
    if (action === 'upload') {
      const actualFileContent = fileContent || fileData;
      
      if (!fileName || !actualFileContent || !actualEmpId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'File name, content, and employee ID are required for upload',
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get cached Backblaze authentication
    const { authData, bucketId } = await getBackblazeAuth();

    if (action === 'upload') {
      // Handle file upload with retry logic
      try {
        // Get upload URL with retry
        const uploadUrlData = await retryWithBackoff(async ()=>{
          const uploadUrlResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
            body: JSON.stringify({ bucketId })
          });

          if (!uploadUrlResponse.ok) {
            const errorText = await uploadUrlResponse.text();
            throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status} ${errorText}`);
          }

          return await uploadUrlResponse.json();
        });

        // Prepare file path using cleaner structure
        const safeFolder = folderName?.toString().trim().replace(/^\/+/g, "").replace(/\/+$/g, "");
        const target = (targetType || 'employee') as 'employee' | 'company';
        let baseFolder = '';
        if (target === 'company') {
          const safeCompany = (companyName || actualEmpId).toString().trim().replace(/^\/+/g, "").replace(/\/+$/g, "");
          baseFolder = `COMP_${safeCompany}`;
        } else {
          baseFolder = `EMP_${actualEmpId}`;
        }
        const filePath = safeFolder
          ? `${baseFolder}/${safeFolder}/${fileName}`
          : `${baseFolder}/${fileName}`;
        
        // Convert base64 to binary
        const actualFileContent = fileContent || fileData;
        
        let binaryData;
        try {
          binaryData = Uint8Array.from(atob(actualFileContent), (c)=>c.charCodeAt(0));
        } catch (decodeError) {
          throw new Error(`Invalid base64 content: ${decodeError.message}`);
        }

        // Calculate SHA1 hash
        const sha1Hash = await calculateSHA1(binaryData);

        // Upload file with retry logic
        const uploadResult = await retryWithBackoff(async ()=>{
          const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
              'Authorization': uploadUrlData.authorizationToken,
              'X-Bz-File-Name': encodeURIComponent(filePath),
              'Content-Type': contentType || 'application/octet-stream',
              'X-Bz-Content-Sha1': sha1Hash,
              'X-Bz-Info-Author': user?.email || 'system'
            },
            body: binaryData
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
          }

          return await uploadResponse.json();
        });


        if (target === 'employee') {
          try {
            // Verify employee exists
            const employee = await verifyEmployee(supabaseClient, actualEmpId);
            
            // Always use the actual employee_id from employee_table for consistency
            // This ensures all documents use the same ID format as the employee table
            const documentRecord = {
              employee_id: actualEmpId, // Always use the string employee_id for consistency
              document_type: documentType || 'other',
              file_type: contentType || 'application/octet-stream',
              file_name: fileName,
              file_url: `https://f005.backblazeb2.com/file/cubsdocs/${filePath}`,
              file_path: filePath, // Include file_path to avoid NOT NULL constraint
              file_size: binaryData.length.toString(), // Convert to string to match schema
              uploaded_at: new Date().toISOString(),
              uploaded_by: user?.id || null,
              is_active: true,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            console.log('📝 Inserting employee document record:', documentRecord);

            const { data: insertedDoc, error: dbError } = await supabaseClient
              .from('employee_documents')
              .insert(documentRecord)
              .select()
              .single();

            if (dbError) {
              console.error('❌ Database insertion error:', dbError);
              
              // If it's a duplicate file_path, try to update the existing record
              if (dbError.code === '23505' && dbError.message.includes('file_path')) {
                console.log('🔄 Duplicate file_path detected, updating existing record...');
                
                const { data: updatedDoc, error: updateError } = await supabaseClient
                  .from('employee_documents')
                  .update({
                    ...documentRecord,
                  .eq('file_path', documentRecord.file_path)
                
                if (updateError) {
                  console.error('❌ Update error:', updateError);
                } else {
                  console.log('✅ Document record updated successfully:', updatedDoc.id);
                }
              } else {
                console.error('❌ Non-duplicate database error:', dbError);
              }
            } else {
              console.log('✅ Document record inserted successfully:', insertedDoc.id);
            }
          } catch (empError) {
            console.error('❌ Employee document insertion error:', empError);
            // Don't fail the upload - file is already uploaded to B2
          }
                } else {
          // Handle company document upload - use existing employee_documents table with special employee_id
          
          try {
            // Save company document metadata to existing employee_documents table
            const companyDocumentRecord = {
              employee_id: 'COMPANY_DOCS', // Special employee_id for company documents
              file_path: filePath,
            };

            console.log('📝 Inserting company document record:', companyDocumentRecord);

            // Insert the company document record into employee_documents table
              .insert(companyDocumentRecord)

              
                
                    ...companyDocumentRecord,
                  .eq('file_path', companyDocumentRecord.file_path)
                
                }
              }
            }
          } catch (companyError) {
            console.error('❌ Company document insertion error:', companyError);
            // Don't fail the upload - file is already uploaded to B2
          }
        }

        return new Response(JSON.stringify({
          success: true,
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName,
          fileUrl: `https://f005.backblazeb2.com/file/cubsdocs/${filePath}`,
          filePath: filePath, // Return file path for client
          size: binaryData.length,

          error: error.message || 'Upload failed',
          status: 500,
      }
    }

    // Handle list action
    if (action === 'list') {
        
        if (target === 'company') {
          
          // Get company documents from employee_documents table using special employee_id
          const { data: companyDocs, error: companyError } = await supabaseClient
            .from('employee_documents')
            .select('*')
            .eq('employee_id', 'COMPANY_DOCS')
            .order('created_at', { ascending: false });
          
          if (companyError) {
              error: companyError.message,
              files: []
          }
          
          
            files: companyDocs || [],
            count: companyDocs?.length || 0

          // Verify employee exists first
          const employee = await verifyEmployee(supabaseClient, actualEmpId);
          
          // Get employee UUID for database lookup
          const employeeUUID = await getEmployeeUUID(supabaseClient, actualEmpId);

          // Get documents using both string and UUID employee_id for compatibility
          let documents = [];
          
          if (employeeUUID) {
            const { data: uuidDocs, error: uuidError } = await supabaseClient
              .eq('employee_id', employeeUUID);
            
            if (!uuidError && uuidDocs) {
              documents = [...documents, ...uuidDocs];
            }
          }
          
          // Also try with string employee_id
          const { data: stringDocs, error: stringError } = await supabaseClient
          .eq('employee_id', actualEmpId);

          if (!stringError && stringDocs) {
            documents = [...documents, ...stringDocs];
          }
          
          // Remove duplicates based on file_name and file_path
          const uniqueDocs = documents.filter((doc, index, self) => 
            index === self.findIndex(d => d.file_name === doc.file_name && d.file_path === doc.file_path)
          );


            files: uniqueDocs,
            count: uniqueDocs.length
        }
          error: error.message,
      }
    }

    // Handle getPrefixAuth action to obtain a reusable token for a folder/prefix
    if (action === 'getPrefixAuth') {
      try {
        // Determine prefix from provided path or components
        let filePath = explicitFilePath || directFilePath || '';
        if (!filePath) {
          // Fallback to base construction similar to getSignedUrl
          const safeBase = (targetType === 'company')
            ? `COMP_${(companyName || actualEmpId || '').toString().trim().replace(/^\/+/g, '').replace(/\/+$/g, '')}`
            : `EMP_${actualEmpId}`;
          filePath = folderName ? `${safeBase}/${folderName}/` : `${safeBase}/`;
        }
        // Ensure prefix ends with '/'
        const lastSlash = filePath.lastIndexOf('/');
        const prefix = lastSlash >= 0 ? filePath.substring(0, lastSlash + 1) : (filePath.endsWith('/') ? filePath : `${filePath}/`);

        // Generate download authorization for the prefix
        const downloadAuthData = await retryWithBackoff(async () => {
          const downloadAuthResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_download_authorization`, {
            method: 'POST',
            headers: {
              'Authorization': authData.authorizationToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bucketId,
              fileNamePrefix: prefix,
              validDurationInSeconds: 3600
            })
          });

          if (!downloadAuthResponse.ok) {
            const errorText = await downloadAuthResponse.text();
            throw new Error(`Failed to get download authorization: ${downloadAuthResponse.status} ${errorText}`);
          }

          return await downloadAuthResponse.json();
        });

        const payload = {
          success: true,
          prefix,
          authorizationToken: downloadAuthData.authorizationToken,
          downloadUrl: authData.downloadUrl,
          expiresIn: 3600
        };

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error?.message || 'Failed to get prefix auth' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle getSignedUrl action for downloads
    if (action === 'getSignedUrl') {
      try {
        // Use the explicit file path if provided, otherwise fall back to construction
        let filePath = explicitFilePath || directFilePath || '';

        // If we have a direct file path from the database, use it exactly as stored
        if (directFilePath && directFilePath.includes('/')) {
          filePath = directFilePath;
          console.log('🔍 Using direct file path from database:', filePath);
        } else if (!filePath) {
            const safeCompany = (companyName || actualEmpId).toString().trim().replace(/^\/+/g, '').replace(/\/+$/g, '');
            filePath = `COMP_${safeCompany}/${fileName}`;
          } else {
            filePath = `EMP_${actualEmpId}/${fileName}`;
          }
        }
        

        // Generate download authorization
        const downloadAuthData = await retryWithBackoff(async () => {
          const downloadAuthResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_download_authorization`, {
              fileNamePrefix: filePath,
              validDurationInSeconds: 3600 // 1 hour

          if (!downloadAuthResponse.ok) {
            const errorText = await downloadAuthResponse.text();
            throw new Error(`Failed to get download authorization: ${downloadAuthResponse.status} ${errorText}`);
          }

          return await downloadAuthResponse.json();
        });

        // Construct signed URL 
        const signedUrl = `${authData.downloadUrl}/file/cubsdocs/${encodeURI(filePath)}?Authorization=${downloadAuthData.authorizationToken}`;


          signedUrl
          error: error.message || 'Failed to generate signed URL'
      }
    }

    // Handle rename action
    if (action === 'rename') {
      try {
        if (!oldFileName || !newFileName) {
            error: 'Old file name and new file name are required for rename',
        }

        // Find the document record first
        let document: any = null;
        const employeeUUID = await getEmployeeUUID(supabaseClient, actualEmpId);

        // Try to find document with UUID first
        if (employeeUUID) {
          const { data: uuidDoc } = await supabaseClient
            .eq('employee_id', employeeUUID)
            .eq('file_name', oldFileName)
            .single();
          
          if (uuidDoc) {
            document = uuidDoc;
          }
        }
        
        // If not found with UUID, try with string employee_id
        if (!document) {
          const { data: stringDoc } = await supabaseClient
            .eq('employee_id', actualEmpId)
          
          if (stringDoc) {
            document = stringDoc;
          }
        }

            error: 'Document not found',
            status: 404,
        }

        // Update the database record with new file name
            file_name: newFileName,
          .eq('id', document.id);

            error: `Database update failed: ${updateError.message}`,
        }

          message: 'File renamed successfully',
          oldFileName,
          newFileName,

          error: error.message || 'Rename failed',
      }
    }

    // Handle delete action
    if (action === 'delete') {

        // Try to fetch DB record first using multiple approaches
        let document: any = null;
        let filePath = directFilePath || '';
        
        if (target === 'company') {
          // Try to find company document in employee_documents table
          const { data: companyDoc } = await supabaseClient
            .eq('file_name', fileName)
            .single();
          
          if (companyDoc) {
            document = companyDoc;
          }

            
            }
          }
          
            
            }
          }
        }
        
        if (document) {
          filePath = document.file_path || (target === 'company' 
            ? `COMP_${(companyName || actualEmpId).toString().trim().replace(/^\/+/g, '').replace(/\/+$/g, '')}/${fileName}`
            : `EMP_${actualEmpId}/${fileName}`);
        }

        // Fallback: construct path if not found
        if (!filePath) {
          const safeBase = (target === 'company')
            ? `COMP_${(companyName || actualEmpId).toString().trim().replace(/^\/+/g, '').replace(/\/+$/g, '')}`
            : `EMP_${actualEmpId}`;
          filePath = `${safeBase}/${fileName}`;
        }

        // Delete from Backblaze

        try {
          // Get file info first to get the fileId
          const fileInfoResponse = await retryWithBackoff(async () => {
            const response = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_file_names`, {
                startFileName: filePath,
                maxFileCount: 1

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to list files: ${response.status} ${errorText}`);
            }

            return await response.json();
          });

          const fileInfo = fileInfoResponse.files?.find(f => f.fileName === filePath);
          if (!fileInfo) {
          } else {
            // Delete the file from Backblaze
            await retryWithBackoff(async () => {
              const deleteResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_delete_file_version`, {
                  fileId: fileInfo.fileId,
                  fileName: filePath

              if (!deleteResponse.ok) {
                const errorText = await deleteResponse.text();
                throw new Error(`Failed to delete file from Backblaze: ${deleteResponse.status} ${errorText}`);
              }

              return await deleteResponse.json();
            });
          }
        } catch (backblazeError) {
          // Continue with database deletion even if Backblaze fails
        }

        // Delete from database if we found a record
        if (document) {
          // Always use employee_documents table since company docs are stored there too
          const { error: dbDeleteError } = await supabaseClient
            .from('employee_documents')
            .delete()
            .eq('id', document.id);

          if (dbDeleteError) {
              error: `Database deletion failed: ${dbDeleteError.message}`,
          }
        }


          message: 'Document deleted successfully',

          error: error.message || 'Delete failed',
      }
    }

    // Default response for unsupported actions
      error: `Unsupported action: ${action}`,

      error: error.message || 'Internal server error',
  }
});