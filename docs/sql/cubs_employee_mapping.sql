-- CUBS Employee Name Mapping and Database Alignment
-- This script ensures proper mapping between CUBS folder names and database employees
-- Run this in Supabase SQL Editor to align everything

-- Step 1: Create a mapping table for CUBS employees
CREATE TABLE IF NOT EXISTS cubs_employee_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nationality TEXT DEFAULT 'Indian',
  trade TEXT DEFAULT 'Driver',
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(folder_name),
  UNIQUE(employee_id)
);

-- Step 2: Insert the CUBS employee names you provided with proper mapping
INSERT INTO cubs_employee_mapping (folder_name, employee_id, full_name, nationality, trade) VALUES
-- Core CUBS employees with proper IDs
('ANCIL ZAVIER', 'CUB001', 'ANCIL ZAVIER', 'Indian', 'Driver'),
('RINJO JOSE', 'CUB002', 'RINJO JOSE', 'Indian', 'Driver'),
('MD KASRU MIAH', 'CUB003', 'MD KASRU MIAH', 'Bangladeshi', 'Driver'),
('ISMAIL KHAN', 'CUB004', 'ISMAIL KHAN', 'Pakistani', 'Driver'),
('NASIM ABDUL KHADIR', 'CUB005', 'NASIM ABDUL KHADIR', 'Indian', 'Driver'),
('JAY NARAYAN', 'CUB006', 'JAY NARAYAN', 'Indian', 'Driver'),
('MOHAMMAD HOSSAIN', 'CUB007', 'MOHAMMAD HOSSAIN', 'Bangladeshi', 'Driver'),
('MD RAKIB HOSSEN', 'CUB008', 'MD RAKIB HOSSEN', 'Bangladeshi', 'Driver'),
('ISHVERBHAI CHHAGANBHAI', 'CUB009', 'ISHVERBHAI CHHAGANBHAI', 'Indian', 'Driver'),
('DHANAPAL KALIYAN', 'CUB010', 'DHANAPAL KALIYAN', 'Indian', 'Driver'),
('MD KAMAL UDDIN', 'CUB011', 'MD KAMAL UDDIN', 'Bangladeshi', 'Driver'),
('AHSANUL KARIM', 'CUB012', 'AHSANUL KARIM', 'Bangladeshi', 'Driver'),
('SAKTHIVEL SUBRAMANIAN', 'CUB013', 'SAKTHIVEL SUBRAMANIAN', 'Indian', 'Driver'),
('RAM DAYAL CHAMAR', 'CUB014', 'RAM DAYAL CHAMAR', 'Indian', 'Driver'),
('RAM EKBAL CHAMAR', 'CUB015', 'RAM EKBAL CHAMAR', 'Indian', 'Driver'),
('ASGAR HUSSAIN', 'CUB016', 'ASGAR HUSSAIN', 'Pakistani', 'Driver'),
('FARUKUL ISLAM', 'CUB017', 'FARUKUL ISLAM', 'Bangladeshi', 'Driver'),
('MD KABIR HOSSEM', 'CUB018', 'MD KABIR HOSSEM', 'Bangladeshi', 'Driver'),
('MD MASUM MOHAMMAD', 'CUB019', 'MD MASUM MOHAMMAD', 'Bangladeshi', 'Driver'),
('BILAL HOSSAN MD NASAR', 'CUB020', 'BILAL HOSSAN MD NASAR', 'Bangladeshi', 'Driver'),
('SHALA UDDIN LUKMAN BUKAUL', 'CUB021', 'SHALA UDDIN LUKMAN BUKAUL', 'Bangladeshi', 'Driver'),
('MD SIRAZUL ISLAM', 'CUB022', 'MD SIRAZUL ISLAM', 'Bangladeshi', 'Driver'),
('PRINCE VARGHESE', 'CUB023', 'PRINCE VARGHESE', 'Indian', 'Driver'),
('MISHAN RAI', 'CUB024', 'MISHAN RAI', 'Nepali', 'Driver'),
('RAM KUMAR CHAMAR', 'CUB025', 'RAM KUMAR CHAMAR', 'Indian', 'Driver'),
('MUKESH KUMAR DAS', 'CUB026', 'MUKESH KUMAR DAS', 'Indian', 'Driver'),
('AMAR KUMAR SHARMA', 'CUB027', 'AMAR KUMAR SHARMA', 'Indian', 'Driver'),
('SAIFUL ISLAM', 'CUB028', 'SAIFUL ISLAM', 'Bangladeshi', 'Driver'),
('MUHAMMAD YASEEN MHAMMAD', 'CUB029', 'MUHAMMAD YASEEN MHAMMAD', 'Pakistani', 'Driver'),
('BIJU KUMAR VIJAYAN', 'CUB030', 'BIJU KUMAR VIJAYAN', 'Indian', 'Driver'),
('BIJU SIVANANDAN', 'CUB031', 'BIJU SIVANANDAN', 'Indian', 'Driver'),
('JANAKA KASUN DON', 'CUB032', 'JANAKA KASUN DON', 'Sri Lankan', 'Driver'),
('NASIR ULLAH', 'CUB033', 'NASIR ULLAH', 'Pakistani', 'Driver'),
('SHARIF DEWAN', 'CUB034', 'SHARIF DEWAN', 'Bangladeshi', 'Driver'),
('RAN BAHADUR GHARTI', 'CUB035', 'RAN BAHADUR GHARTI', 'Nepali', 'Driver'),
('RAHUL DAS TATMA', 'CUB036', 'RAHUL DAS TATMA', 'Indian', 'Driver'),
('PREM BAHADUR NEPALI', 'CUB037', 'PREM BAHADUR NEPALI', 'Nepali', 'Driver'),
('BHIM LAL GIRI', 'CUB038', 'BHIM LAL GIRI', 'Nepali', 'Driver')
ON CONFLICT (folder_name) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  full_name = EXCLUDED.full_name,
  nationality = EXCLUDED.nationality,
  trade = EXCLUDED.trade,
  updated_at = NOW()
ON CONFLICT (employee_id) DO UPDATE SET
  folder_name = EXCLUDED.folder_name,
  full_name = EXCLUDED.full_name,
  nationality = EXCLUDED.nationality,
  trade = EXCLUDED.trade,
  updated_at = NOW();

-- Step 3: Upsert into main employee_table
INSERT INTO employee_table (
  employee_id,
  name,
  company_name,
  nationality,
  trade,
  status,
  is_active,
  created_at,
  updated_at
)
SELECT 
  cem.employee_id,
  cem.full_name,
  'CUBS' as company_name,
  cem.nationality,
  cem.trade,
  cem.status,
  cem.is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM cubs_employee_mapping cem
ON CONFLICT (employee_id) DO UPDATE SET
  name = EXCLUDED.name,
  company_name = EXCLUDED.company_name,
  nationality = EXCLUDED.nationality,
  trade = EXCLUDED.trade,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Step 4: Create a function to get employee by folder name
CREATE OR REPLACE FUNCTION get_cubs_employee_by_folder(folder_name_input TEXT)
RETURNS TABLE(
  employee_id TEXT,
  full_name TEXT,
  nationality TEXT,
  trade TEXT,
  company_name TEXT
) LANGUAGE SQL AS $$
  SELECT 
    cem.employee_id,
    cem.full_name,
    cem.nationality,
    cem.trade,
    'CUBS' as company_name
  FROM cubs_employee_mapping cem
  WHERE cem.folder_name = folder_name_input
    OR cem.full_name ILIKE '%' || folder_name_input || '%'
    OR cem.employee_id = folder_name_input;
$$;

-- Step 5: Create a function to get all CUBS employees for document mapping
CREATE OR REPLACE FUNCTION get_all_cubs_employees_for_docs()
RETURNS TABLE(
  folder_name TEXT,
  employee_id TEXT,
  full_name TEXT,
  nationality TEXT,
  trade TEXT,
  company_name TEXT
) LANGUAGE SQL AS $$
  SELECT 
    cem.folder_name,
    cem.employee_id,
    cem.full_name,
    cem.nationality,
    cem.trade,
    'CUBS' as company_name
  FROM cubs_employee_mapping cem
  ORDER BY cem.employee_id;
$$;

-- Step 6: Create a view for easy access to CUBS employee mapping
CREATE OR REPLACE VIEW cubs_employee_document_mapping AS
SELECT 
  cem.folder_name,
  cem.employee_id,
  cem.full_name,
  cem.nationality,
  cem.trade,
  'CUBS' as company_name,
  cem.status,
  cem.is_active,
  -- Document folder path for Backblaze
  'CUBS/' || cem.folder_name as document_folder_path,
  -- Employee folder path for Supabase
  'CUBS/' || cem.employee_id as employee_folder_path
FROM cubs_employee_mapping cem
WHERE cem.is_active = true;

-- Step 7: Verification queries
-- Check mapping table
SELECT 'CUBS Employee Mapping Count:' as info, COUNT(*) as count FROM cubs_employee_mapping;

-- Check main employee table
SELECT 'CUBS Employees in Main Table:' as info, COUNT(*) as count 
FROM employee_table 
WHERE company_name = 'CUBS';

-- Show sample mapping
SELECT 'Sample CUBS Employee Mapping:' as info;
SELECT 
  folder_name,
  employee_id,
  full_name,
  nationality,
  trade,
  document_folder_path
FROM cubs_employee_document_mapping
LIMIT 10;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cubs_employee_mapping_folder_name ON cubs_employee_mapping(folder_name);
CREATE INDEX IF NOT EXISTS idx_cubs_employee_mapping_employee_id ON cubs_employee_mapping(employee_id);
CREATE INDEX IF NOT EXISTS idx_cubs_employee_mapping_full_name ON cubs_employee_mapping(full_name);

-- Step 9: Grant permissions
GRANT SELECT ON cubs_employee_mapping TO authenticated;
GRANT SELECT ON cubs_employee_document_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION get_cubs_employee_by_folder(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_cubs_employees_for_docs() TO authenticated;

-- Success message
SELECT 'CUBS Employee Mapping Setup Complete!' as status;

