# Fix Company Name Duplicates and Missing Companies

## Problem
The employee management system had several issues with company names:

### Fluid Engineering Duplicates:
- `FLUID ENGINEERING` (correct, active)
- `FLUID ENGINEERING SERVICES` (duplicate, should be removed)
- `FLUID` (abbreviated version, should be consolidated)

### Missing CUBS Companies:
- `CUBS` was missing from the company selection dropdown
- Multiple CUBS-related company names existed but weren't all showing up
- Company filtering was too restrictive

This caused confusion in the employee form dropdown where users would see duplicate Fluid Engineering options but miss important companies like CUBS.

## Solution

### 1. Database Cleanup
Run the SQL scripts to consolidate company names:

```sql
-- Execute: scripts/fix_fluid_engineering_duplicates.sql
-- Execute: scripts/fix_cubs_company_names.sql
-- Execute: scripts/check_all_companies.sql (to verify)
```

These scripts:
- **Fluid Engineering**: Updates all `FLUID ENGINEERING SERVICES` and `FLUID` records to `FLUID ENGINEERING`
- **CUBS Companies**: Ensures all CUBS-related companies are properly named and available
- **Verification**: Shows all companies that should appear in dropdowns

### 2. Application-Level Filtering
Updated the employee forms to filter out duplicate company names:

#### Files Modified:
- `app/admin/employees/new/page.tsx` - Main employee form
- `app/(admin)/employees/new.tsx` - Alternative employee form
- `lib/services/employees.ts` - EmployeeService.getFilterOptions()

#### Changes Made:
1. **Dynamic Company Loading**: Both forms now load companies from the database instead of hardcoded lists
2. **Improved Filtering**: Updated filters to:
   - Remove `Company Documents` (not a real company)
   - Remove `FLUID ENGINEERING SERVICES` and `FLUID` (duplicates)
   - **Keep all CUBS-related companies** (CUBS, CUBS TECH, etc.)
   - Keep all other active companies
3. **Loading States**: Added proper loading indicators while companies are being fetched

### 3. Benefits
- ✅ **Single Source of Truth**: Only one "FLUID ENGINEERING" option in dropdowns
- ✅ **Complete Company List**: All active companies including CUBS are now available
- ✅ **Consistent Data**: All employees use standardized company names
- ✅ **Better UX**: No confusion from duplicate options, all companies accessible
- ✅ **Maintainable**: Easy to add/remove companies by updating the database

### 4. Verification
After running the fix:

1. **Check Database**:
   ```sql
   SELECT company_name, COUNT(*) as employee_count
   FROM employee_table 
   WHERE company_name LIKE '%FLUID%'
   GROUP BY company_name;
   ```
   Should show only `FLUID ENGINEERING` with the total count.

2. **Check Employee Form**:
   - Navigate to `/admin/employees/new`
   - Company dropdown should show:
     - One "FLUID ENGINEERING" option (no duplicates)
     - All CUBS-related companies (CUBS, CUBS TECH, etc.)
     - All other active companies
   - No duplicate or abbreviated versions

3. **Check Employee List**:
   - Navigate to `/admin/employees`
   - Filter by company should show all active companies including CUBS

### 5. Prevention
To prevent future duplicates:

1. **Use Company Service**: Always use `EmployeeService.getFilterOptions()` to get company lists
2. **Database Constraints**: Consider adding unique constraints on company names
3. **Data Validation**: Validate company names during import processes
4. **Regular Audits**: Periodically check for duplicate company names

### 6. Rollback (if needed)
If the consolidation causes issues, you can rollback by:

```sql
-- Restore original company names (if you have a backup)
UPDATE employee_table 
SET company_name = 'FLUID ENGINEERING SERVICES'
WHERE employee_id LIKE 'FLUID_ENGINEERING%' 
  AND employee_id IN (SELECT employee_id FROM backup_table);
```

## Summary
This fix ensures that:
- Only one "FLUID ENGINEERING" company option appears in all dropdowns
- All CUBS-related companies (CUBS, CUBS TECH, etc.) are available in dropdowns
- All active companies from the database are properly accessible
- All employees are properly associated with the correct company names
- The user experience is improved by eliminating confusion from duplicate options
- The system is more maintainable with centralized company management
