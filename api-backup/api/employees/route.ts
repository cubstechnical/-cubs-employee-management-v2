import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError, validateRequiredFields } from '@/lib/api/middleware';
import { EmployeeService } from '@/lib/services/employees';

// GET /api/employees - Get all employees with pagination and filters
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // Parse pagination parameters
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      
      // Parse filter parameters
      const filters = {
        search: searchParams.get('search') || undefined,
        company_name: searchParams.get('company_name') || undefined,
        status: searchParams.get('status') || undefined,
        visa_status: searchParams.get('visa_status') || undefined,
        trade: searchParams.get('trade') || undefined,
        nationality: searchParams.get('nationality') || undefined,
      };

      const result = await EmployeeService.getEmployees(
        { page, pageSize },
        filters
      );

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.employees,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // Validate required fields
      const requiredFields = [
        'employee_id', 'name', 'trade', 'nationality', 'joining_date',
        'passport_no', 'passport_expiry', 'labourcard_no', 'labourcard_expiry',
        'visastamping_date', 'visa_expiry_date', 'eid', 'wcc', 'lulu_wps_card',
        'basic_salary', 'company_name', 'passport_number', 'visa_number',
        'visa_type', 'visa_status', 'dob', 'date_of_birth', 'join_date',
        'mobile_number', 'home_phone_number', 'email_id', 'company_id',
        'status', 'is_active'
      ];
      
      validateRequiredFields(body, requiredFields);

      const employee = await EmployeeService.createEmployee(body);

      if (!employee) {
        return NextResponse.json(
          { error: 'Failed to create employee' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: employee,
        message: 'Employee created successfully',
      }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  });
} 