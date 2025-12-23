/**
 * Database Type Definitions
 * Auto-generated types matching Supabase schema
 * This provides type safety for all database operations
 */

// ============================================
// Core Database Tables
// ============================================

export interface Employee {
    id: string;
    employee_id: string;
    name: string;
    email_id: string | null;
    mobile_number: string | null;
    company_name: string;
    trade: string;
    nationality: string | null;
    visa_expiry_date: string | null;
    visa_status: string | null;
    passport_number: string | null;
    work_permit_number: string | null;
    is_active: boolean;
    status?: string; // Employee employment status
    joining_date?: string | null;
    created_at: string;
    updated_at: string | null;
    created_by: string | null;
    // Notification flags
    notification_sent_60?: boolean;
    notification_sent_30?: boolean;
    notification_sent_15?: boolean;
    notification_sent_7?: boolean;
    notification_sent_1?: boolean;
}

export interface UserProfile {
    id: string;
    email: string;
    role: 'admin' | 'user' | 'viewer';
    full_name: string | null;
    created_at: string;
    updated_at: string | null;
    last_login: string | null;
}

export interface VisaHistory {
    id: string;
    employee_id: string;
    old_expiry_date: string | null;
    new_expiry_date: string | null;
    old_status: string | null;
    new_status: string | null;
    change_type: 'renewal' | 'new_visa' | 'status_change' | 'correction';
    changed_at: string;
    changed_by: string | null;
    notes: string | null;
}

export interface EmployeeDocument {
    id: string;
    employee_id: string;
    document_type: string;
    document_name: string;
    file_url: string;
    file_size: number | null;
    uploaded_at: string;
    uploaded_by: string | null;
}

// ============================================
// RPC Function Response Types
// ============================================

export interface DashboardMetricsResponse {
    totalEmployees: number;
    totalDocuments: number;
    employeeGrowth: number;
    documentGrowth: number;
    activeEmployees: number;
    inactiveEmployees: number;
    visaExpiringSoon: number;
    visaExpired: number;
    visaValid: number;
    totalCompanies: number;
}

export interface VisaTrendResponse {
    months: string[];
    expiring: number[];
    expired: number[];
    renewed: number[];
}

// ============================================
// Service-Specific Types
// ============================================

export interface EmployeeFilters {
    searchTerm?: string;
    status?: 'all' | 'active' | 'inactive';
    company?: string;
    trade?: string;
    visaStatus?: 'all' | 'valid' | 'expiring' | 'expired';
}

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================
// Auth Types
// ============================================

export interface AuthUser {
    id: string;
    email: string;
    role: string;
    full_name: string | null;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
}

export interface AuthSession {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    token_type: string;
    user: AuthUser;
}

// ============================================
// Utility Types
// ============================================

export type VisaStatus = 'valid' | 'expiring_soon' | 'expired' | 'unknown';
export type EmployeeStatus = 'active' | 'inactive';
export type UserRole = 'admin' | 'user' | 'viewer';

// ============================================
// Type Guards
// ============================================

export function isEmployee(obj: any): obj is Employee {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string'
    );
}

export function isUserProfile(obj: any): obj is UserProfile {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.email === 'string'
    );
}
