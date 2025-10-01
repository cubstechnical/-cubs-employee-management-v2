// Employee ID generation utilities based on company prefixes
// Matches the current system: AAK, CUB, FE, ALHT, ALM, CCS, GCGC, RAA

import { supabase } from '@/lib/supabase/client';
import { log } from '@/lib/utils/productionLogger';

export interface CompanyConfig {
  code: string;
  name: string;
  currentSequence: number;
  prefix: string;
}

// Company configurations based on current employee data
export const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
  'ASHBAL AL KHALEEJ': {
    code: 'AAK',
    name: 'ASHBAL AL KHALEEJ',
    currentSequence: 28, // Next available number after AAK028
    prefix: 'AAK'
  },
  'CUBS': {
    code: 'CUB',
    name: 'CUBS',
    currentSequence: 39, // Next available number after CUB039
    prefix: 'CUB'
  },
  'FLUID ENGINEERING': {
    code: 'FE',
    name: 'FLUID ENGINEERING',
    currentSequence: 24, // Next available number after FE024
    prefix: 'FE'
  },
  'AL ASHBAL AJMAN': {
    code: 'AAL',
    name: 'AL ASHBAL AJMAN',
    currentSequence: 40, // Next available number after AAL040
    prefix: 'AAL'
  },
  'CUBS CONTRACTING': {
    code: 'CCS',
    name: 'CUBS CONTRACTING',
    currentSequence: 53, // Next available number after CCS053
    prefix: 'CCS'
  },
  'GOLDEN CUBS': {
    code: 'GCGC',
    name: 'GOLDEN CUBS',
    currentSequence: 28, // Next available number after GCGC028
    prefix: 'GCGC'
  },
  'AL HANA TOURS & TRAVELS': {
    code: 'ALHT',
    name: 'AL HANA TOURS & TRAVELS',
    currentSequence: 6, // Next available number after ALHT006
    prefix: 'ALHT'
  },
  'AL MACEN': {
    code: 'ALM',
    name: 'AL MACEN',
    currentSequence: 39, // Next available number after ALM039
    prefix: 'ALM'
  },
  'RUKIN AL ASHBAL': {
    code: 'RAA',
    name: 'RUKIN AL ASHBAL',
    currentSequence: 32, // Next available number after RAA032
    prefix: 'RAA'
  }
};

/**
 * Get the highest employee ID number for a company from the database
 * @param companyName - Full company name
 * @returns Highest sequence number or 0 if none found
 */
async function getHighestSequenceFromDatabase(companyName: string, prefix: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('employee_table')
      .select('employee_id')
      .eq('company_name', companyName)
      .like('employee_id', `${prefix}%`)
      .order('employee_id', { ascending: false })
      .limit(1);

    if (error) {
      log.error('Error fetching highest employee ID:', error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Extract the number from the employee ID (e.g., "AAK028" -> 28)
    const lastId = (data[0] as any).employee_id as string;
    const match = lastId.match(/\d+$/);
    return match ? parseInt(match[0], 10) : 0;
  } catch (error) {
    log.error('Error in getHighestSequenceFromDatabase:', error);
    return 0;
  }
}

/**
 * Check if an employee ID already exists in the database
 * @param employeeId - Employee ID to check
 * @returns boolean indicating if ID exists
 */
async function employeeIdExists(employeeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('employee_table')
      .select('employee_id')
      .eq('employee_id', employeeId)
      .limit(1);

    if (error) {
      log.error('Error checking employee ID existence:', error);
      return false;
    }

    return !!(data && data.length > 0);
  } catch (error) {
    log.error('Error in employeeIdExists:', error);
    return false;
  }
}

/**
 * Generate the next employee ID for a given company (with database sync)
 * @param companyName - Full company name
 * @returns Generated employee ID or null if company not found
 */
export async function generateNextEmployeeId(companyName: string): Promise<string | null> {
  const config = COMPANY_CONFIGS[companyName];
  if (!config) {
    log.warn(`Company "${companyName}" not found in configuration`);
    return null;
  }

  try {
    // Get the highest sequence from database to ensure we don't duplicate
    const dbSequence = await getHighestSequenceFromDatabase(companyName, config.prefix);
    
    // Use the higher of the two (config or database)
    const currentSequence = Math.max(config.currentSequence, dbSequence);
    
    // Generate next ID
    let nextSequence = currentSequence + 1;
    let employeeId = `${config.prefix}${nextSequence.toString().padStart(3, '0')}`;
    
    // Double-check if ID exists (in case of race conditions)
    let attempts = 0;
    while (await employeeIdExists(employeeId) && attempts < 10) {
      log.warn(`Employee ID ${employeeId} already exists, incrementing...`);
      nextSequence++;
      employeeId = `${config.prefix}${nextSequence.toString().padStart(3, '0')}`;
      attempts++;
    }

    if (attempts >= 10) {
      log.error(`Failed to generate unique employee ID after 10 attempts`);
      return null;
    }

    // Update the config with the new sequence
    config.currentSequence = nextSequence;

    log.info(`Generated employee ID: ${employeeId} for company: ${companyName}`);
    return employeeId;
  } catch (error) {
    log.error('Error generating employee ID:', error);
    return null;
  }
}

/**
 * Validate if an employee ID matches the expected format for its company
 * @param employeeId - Employee ID to validate
 * @param companyName - Company name for validation
 * @returns boolean indicating if the ID is valid
 */
export function validateEmployeeId(employeeId: string, companyName: string): boolean {
  const config = COMPANY_CONFIGS[companyName];
  if (!config) {
    return false;
  }

  // Check format: XXX### (e.g., AAK001, CUB002, etc.)
  const expectedPattern = new RegExp(`^${config.prefix}\\d{3}$`);
  return expectedPattern.test(employeeId);
}

/**
 * Extract company information from an employee ID
 * @param employeeId - Employee ID to parse
 * @returns Company configuration or null if not found
 */
export function getCompanyFromEmployeeId(employeeId: string): CompanyConfig | null {
  // Extract prefix (first 3-5 characters before digits)
  const match = employeeId.match(/^([A-Z]{2,5})\d{3}$/);
  if (!match) {
    return null;
  }

  const prefix = match[1];

  // Find company with matching prefix
  for (const config of Object.values(COMPANY_CONFIGS)) {
    if (config.prefix === prefix) {
      return config;
    }
  }

  return null;
}

/**
 * Get all available companies for employee ID generation
 * @returns Array of company names
 */
export function getAvailableCompanies(): string[] {
  return Object.keys(COMPANY_CONFIGS);
}

/**
 * Reset sequence numbers (for testing/development only)
 * @param companyName - Company to reset (optional, resets all if not specified)
 */
export function resetSequences(companyName?: string): void {
  if (companyName) {
    const config = COMPANY_CONFIGS[companyName];
    if (config) {
      // Reset to a reasonable starting point
      config.currentSequence = 0;
    }
  } else {
    // Reset all companies
    Object.values(COMPANY_CONFIGS).forEach(config => {
      config.currentSequence = 0;
    });
  }
}

/**
 * Get the current sequence number for a company
 * @param companyName - Company name
 * @returns Current sequence number or null if company not found
 */
export function getCurrentSequence(companyName: string): number | null {
  const config = COMPANY_CONFIGS[companyName];
  return config ? config.currentSequence : null;
}

/**
 * Preview the next employee ID without incrementing the sequence
 * @param companyName - Company name
 * @returns Preview of next employee ID or null if company not found
 */
export async function previewNextEmployeeId(companyName: string): Promise<string | null> {
  const config = COMPANY_CONFIGS[companyName];
  if (!config) {
    return null;
  }

  try {
    // Get the highest sequence from database
    const dbSequence = await getHighestSequenceFromDatabase(companyName, config.prefix);
    const currentSequence = Math.max(config.currentSequence, dbSequence);

    return `${config.prefix}${(currentSequence + 1).toString().padStart(3, '0')}`;
  } catch (error) {
    log.error('Error previewing employee ID:', error);
    return null;
  }
}

/**
 * Get company prefix for display
 * @param companyName - Company name
 * @returns Company prefix or null if not found
 */
export function getCompanyPrefix(companyName: string): string | null {
  const config = COMPANY_CONFIGS[companyName];
  return config ? config.prefix : null;
}

/**
 * Format employee ID for display with company prefix
 * @param sequence - Sequence number
 * @param companyName - Company name
 * @returns Formatted employee ID or null if company not found
 */
export function formatEmployeeId(sequence: number, companyName: string): string | null {
  const config = COMPANY_CONFIGS[companyName];
  if (!config) {
    return null;
  }

  return `${config.prefix}${sequence.toString().padStart(3, '0')}`;
}

