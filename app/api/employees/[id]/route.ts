import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError } from '@/lib/api/middleware';
import { EmployeeService } from '@/lib/services/employees';

// GET /api/employees/[id] - Get employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const employee = await EmployeeService.getEmployeeById(params.id);

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// PUT /api/employees/[id] - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      const employee = await EmployeeService.updateEmployee({ ...body, employee_id: params.id });

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found or update failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: employee,
        message: 'Employee updated successfully',
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// DELETE /api/employees/[id] - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const success = await EmployeeService.deleteEmployee(params.id);

      if (!success) {
        return NextResponse.json(
          { error: 'Employee not found or delete failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
} 