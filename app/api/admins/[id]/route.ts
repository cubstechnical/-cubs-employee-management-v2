import { NextRequest, NextResponse } from 'next/server';
import { withMasterAdminAuth, handleApiError } from '@/lib/api/middleware';
import { AdminService } from '@/lib/services/admins';
import { EmailService } from '@/lib/services/email';

// GET /api/admins/[id] - Get admin by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMasterAdminAuth(request, async (req) => {
    try {
      const admin = await AdminService.getAdminById(params.id);

      if (!admin) {
        return NextResponse.json(
          { error: 'Admin not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: admin,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// PUT /api/admins/[id] - Update admin or approve admin
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMasterAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      let admin;
      
      if (body.action === 'approve') {
        // Approve admin
        const approvalResult = await AdminService.approveAdmin(params.id, req.user.id);
        
        if (!approvalResult.success) {
          return NextResponse.json(
            { error: approvalResult.error || 'Failed to approve admin' },
            { status: 400 }
          );
        }

        // Get admin details for email notification
        const adminData = await AdminService.getAdminById(params.id);
        
        if (adminData.admin) {
          // Send approval notification email
          await EmailService.sendApprovalNotification({
            recipientEmail: adminData.admin.email,
            recipientName: adminData.admin.name,
            adminName: req.user.name || 'Master Admin',
            action: 'approved'
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Admin approved successfully',
        });
      } else {
        // Update admin details
        admin = await AdminService.updateAdmin(params.id, body);
      }

      if (!admin) {
        return NextResponse.json(
          { error: 'Admin not found or update failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: admin,
        message: body.action === 'approve' ? 'Admin approved successfully' : 'Admin updated successfully',
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// DELETE /api/admins/[id] - Delete admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMasterAdminAuth(request, async (req) => {
    try {
      const success = await AdminService.deleteAdmin(params.id);

      if (!success) {
        return NextResponse.json(
          { error: 'Admin not found or delete failed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Admin deleted successfully',
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
} 