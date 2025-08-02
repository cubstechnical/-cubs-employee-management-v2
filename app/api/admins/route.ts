import { NextRequest, NextResponse } from 'next/server';
import { withMasterAdminAuth, handleApiError, validateRequiredFields } from '@/lib/api/middleware';
import { AdminService } from '@/lib/services/admins';
import { EmailService } from '@/lib/services/email';

// GET /api/admins - Get all admins
export async function GET(request: NextRequest) {
  return withMasterAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status'); // 'all', 'approved', 'pending', 'unapproved'
      
      let admins;
      
      switch (status) {
        case 'pending':
          admins = await AdminService.getPendingInvites();
          break;
        case 'unapproved':
          admins = await AdminService.getUnapprovedAdmins();
          break;
        case 'approved':
          admins = await AdminService.getAdmins();
          break;
        default:
          admins = await AdminService.getAdmins();
      }

      return NextResponse.json({
        success: true,
        data: admins,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// POST /api/admins - Invite a new admin
export async function POST(request: NextRequest) {
  return withMasterAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      validateRequiredFields(body, ['email', 'name', 'role']);

      const invite = await AdminService.inviteAdmin({
        email: body.email,
        name: body.name,
        role: body.role,
        invited_by: req.user.id,
      });

      if (!invite) {
        return NextResponse.json(
          { error: 'Failed to create admin invite' },
          { status: 500 }
        );
      }

      // Send invitation email
      await EmailService.sendAdminNotification({
        recipientEmail: body.email,
        recipientName: body.name,
        adminName: req.user.name || 'Master Admin',
        action: 'Admin Invitation',
        details: 'You have been invited to join the CUBS Technical Admin Portal. Please check your email for further instructions.'
      });

      return NextResponse.json({
        success: true,
        data: invite,
        message: 'Admin invitation sent successfully',
      }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  });
} 