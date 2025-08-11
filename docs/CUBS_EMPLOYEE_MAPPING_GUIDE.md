# CUBS Employee Mapping Guide

This guide explains how to properly map CUBS employee names from document folders to the database for correct uploads to both Backblaze and Supabase.

## Overview

The CUBS employee mapping system ensures that:
- Document folder names (e.g., "ANCIL ZAVIER") are correctly mapped to employee IDs (e.g., "CUB001")
- Documents are uploaded to Backblaze with human-readable folder names
- Supabase `employee_documents` table uses consistent employee ID-based paths
- All 38 CUBS employees are properly tracked and managed

## Employee List

The following 38 CUBS employees are included in the mapping:

| Employee ID | Full Name | Nationality | Trade |
|-------------|-----------|-------------|-------|
| CUB001 | ANCIL ZAVIER | Indian | Driver |
| CUB002 | RINJO JOSE | Indian | Driver |
| CUB003 | MD KASRU MIAH | Bangladeshi | Driver |
| CUB004 | ISMAIL KHAN | Pakistani | Driver |
| CUB005 | NASIM ABDUL KHADIR | Indian | Driver |
| CUB006 | JAY NARAYAN | Indian | Driver |
| CUB007 | MOHAMMAD HOSSAIN | Bangladeshi | Driver |
| CUB008 | MD RAKIB HOSSEN | Bangladeshi | Driver |
| CUB009 | ISHVERBHAI CHHAGANBHAI | Indian | Driver |
| CUB010 | DHANAPAL KALIYAN | Indian | Driver |
| CUB011 | MD KAMAL UDDIN | Bangladeshi | Driver |
| CUB012 | AHSANUL KARIM | Bangladeshi | Driver |
| CUB013 | SAKTHIVEL SUBRAMANIAN | Indian | Driver |
| CUB014 | RAM DAYAL CHAMAR | Indian | Driver |
| CUB015 | RAM EKBAL CHAMAR | Indian | Driver |
| CUB016 | ASGAR HUSSAIN | Pakistani | Driver |
| CUB017 | FARUKUL ISLAM | Bangladeshi | Driver |
| CUB018 | MD KABIR HOSSEM | Bangladeshi | Driver |
| CUB019 | MD MASUM MOHAMMAD | Bangladeshi | Driver |
| CUB020 | BILAL HOSSAN MD NASAR | Bangladeshi | Driver |
| CUB021 | SHALA UDDIN LUKMAN BUKAUL | Bangladeshi | Driver |
| CUB022 | MD SIRAZUL ISLAM | Bangladeshi | Driver |
| CUB023 | PRINCE VARGHESE | Indian | Driver |
| CUB024 | MISHAN RAI | Nepali | Driver |
| CUB025 | RAM KUMAR CHAMAR | Indian | Driver |
| CUB026 | MUKESH KUMAR DAS | Indian | Driver |
| CUB027 | AMAR KUMAR SHARMA | Indian | Driver |
| CUB028 | SAIFUL ISLAM | Bangladeshi | Driver |
| CUB029 | MUHAMMAD YASEEN MHAMMAD | Pakistani | Driver |
| CUB030 | BIJU KUMAR VIJAYAN | Indian | Driver |
| CUB031 | BIJU SIVANANDAN | Indian | Driver |
| CUB032 | JANAKA KASUN DON | Sri Lankan | Driver |
| CUB033 | NASIR ULLAH | Pakistani | Driver |
| CUB034 | SHARIF DEWAN | Bangladeshi | Driver |
| CUB035 | RAN BAHADUR GHARTI | Nepali | Driver |
| CUB036 | RAHUL DAS TATMA | Indian | Driver |
| CUB037 | PREM BAHADUR NEPALI | Nepali | Driver |
| CUB038 | BHIM LAL GIRI | Nepali | Driver |

## Database Setup

### 1. Run the SQL Script

Execute the `docs/sql/cubs_employee_mapping.sql` script in your Supabase SQL Editor:

```sql
-- This will create:
-- - cubs_employee_mapping table
-- - Helper functions
-- - Views for easy access
-- - Proper indexes
```

### 2. Verify Setup

Check that the mapping is working:

```sql
-- View all CUBS employees
SELECT * FROM cubs_employee_document_mapping;

-- Check mapping count
SELECT COUNT(*) FROM cubs_employee_mapping;

-- Verify main employee table
SELECT COUNT(*) FROM employee_table WHERE company_name = 'CUBS';
```

## File Path Structure

### Backblaze Storage
Documents are stored with human-readable folder names:
```
CUBS/
├── ANCIL ZAVIER/
│   ├── passport.pdf
│   ├── visa_document.pdf
│   └── labour_card.jpg
├── RINJO JOSE/
│   ├── contract.pdf
│   └── photo.jpg
└── ...
```

### Supabase Database
The `employee_documents` table uses employee ID-based paths:
```
CUBS/
├── CUB001/
│   ├── passport.pdf
│   ├── visa_document.pdf
│   └── labour_card.jpg
├── CUB002/
│   ├── contract.pdf
│   └── photo.jpg
└── ...
```

## Usage Examples

### 1. Find Employee by Folder Name

```sql
-- Using the helper function
SELECT * FROM get_cubs_employee_by_folder('ANCIL ZAVIER');

-- Direct query
SELECT * FROM cubs_employee_mapping 
WHERE folder_name = 'ANCIL ZAVIER';
```

### 2. Get All CUBS Employees for Document Processing

```sql
-- Using the helper function
SELECT * FROM get_all_cubs_employees_for_docs();

-- Direct query
SELECT * FROM cubs_employee_document_mapping;
```

### 3. JavaScript Usage

```javascript
const { processCubsDocuments } = require('./scripts/cubs_document_mapping_utility');

const documents = [
  {
    folderName: 'ANCIL ZAVIER',
    fileName: 'passport.pdf',
    filePath: '/local/path/passport.pdf',
    fileSize: 1024,
    fileType: 'pdf'
  }
];

const results = await processCubsDocuments(documents);
console.log(results.backblazeUploads);
console.log(results.supabaseInserts);
```

## Document Upload Process

### 1. Validate Mapping

Before uploading, validate that all documents can be mapped:

```javascript
const validation = validateDocumentMapping(documents, employeeMapping);
if (validation.unmatched.length > 0) {
  console.log('Unmatched documents:', validation.unmatched);
}
```

### 2. Upload to Backblaze

Use the generated paths for Backblaze uploads:

```javascript
const backblazeUploads = generateBackblazeUploads(validation.valid);
// Each upload contains:
// - sourceFile: Local file path
// - destinationPath: Backblaze path (e.g., "CUBS/ANCIL ZAVIER/passport.pdf")
// - employeeId: "CUB001"
// - employeeName: "ANCIL ZAVIER"
```

### 3. Insert into Supabase

Use the generated data for Supabase inserts:

```javascript
const supabaseInserts = generateSupabaseInserts(validation.valid);
// Each insert contains:
// - employee_id: "CUB001"
// - file_path: "CUBS/CUB001/passport.pdf"
// - file_url: Backblaze URL
// - document_type: "passport"
```

## Error Handling

### Unmatched Documents

If documents can't be mapped, they'll appear in the `unmatched` array:

```javascript
if (results.validation.unmatched.length > 0) {
  console.log('⚠️  Unmatched documents:');
  results.validation.unmatched.forEach(doc => {
    console.log(`   - ${doc.folderName}: ${doc.fileName}`);
  });
}
```

### Common Issues

1. **Folder Name Mismatch**: Ensure folder names exactly match the mapping
2. **Special Characters**: The system normalizes names, but exact matches work best
3. **Case Sensitivity**: Folder names are case-sensitive

## Maintenance

### Adding New Employees

To add new CUBS employees:

```sql
INSERT INTO cubs_employee_mapping (folder_name, employee_id, full_name, nationality, trade)
VALUES ('NEW EMPLOYEE NAME', 'CUB039', 'NEW EMPLOYEE NAME', 'Indian', 'Driver');
```

### Updating Employee Information

```sql
UPDATE cubs_employee_mapping 
SET full_name = 'UPDATED NAME', nationality = 'Pakistani'
WHERE employee_id = 'CUB001';
```

### Deactivating Employees

```sql
UPDATE cubs_employee_mapping 
SET is_active = false, status = 'inactive'
WHERE employee_id = 'CUB001';
```

## Testing

Run the test function to verify the mapping system:

```bash
node scripts/cubs_document_mapping_utility.js
```

This will test the mapping with sample documents and show the results.

## Performance

The system includes indexes for optimal performance:

- `idx_cubs_employee_mapping_folder_name` - Fast folder name lookups
- `idx_cubs_employee_mapping_employee_id` - Fast employee ID lookups
- `idx_cubs_employee_mapping_full_name` - Fast name-based searches

## Security

- All functions require authenticated access
- Employee data is read-only for regular users
- Admin functions require appropriate permissions

## Troubleshooting

### Mapping Not Working

1. Check that the SQL script ran successfully
2. Verify the `cubs_employee_mapping` table exists and has data
3. Ensure folder names match exactly (case-sensitive)
4. Check for special characters in folder names

### Performance Issues

1. Verify indexes are created
2. Check query execution plans
3. Monitor database performance

### Integration Issues

1. Ensure environment variables are set correctly
2. Check Supabase connection
3. Verify table permissions

## Support

For issues or questions:
1. Check the database logs
2. Verify the mapping table contents
3. Test with the utility script
4. Review the error messages in the console output

