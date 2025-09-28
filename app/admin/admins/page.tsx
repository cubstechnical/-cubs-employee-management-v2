'use client';


import { useState, useEffect } from 'react';
// Layout is now handled by the root layout
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Shield, 
  Search, 
  UserPlus, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  User,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { User as UserType, AdminInvite } from '@/types';
import { AdminService } from '@/lib/services/admins';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

export default function AdminManagement() {
  const [admins, setAdmins] = useState<UserType[]>([]);
  const [pendingInvites, setPendingInvites] = useState<AdminInvite[]>([]);
  const [unapprovedAdmins, setUnapprovedAdmins] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock current user (replace with actual auth)
  const currentUser = {
    id: '1',
    role: 'master_admin' as const,
    email: 'master@cubstechnical.com'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load admins
    const { admins: adminsData } = await AdminService.getAdmins();
    setAdmins(adminsData);

    // Load pending invites
    const { invites } = await AdminService.getPendingInvites();
    setPendingInvites(invites);

    // Load unapproved admins
    const { admins: unapprovedData } = await AdminService.getUnapprovedAdmins();
    setUnapprovedAdmins(unapprovedData);

    setLoading(false);
  };

  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteAdmin = async (formData: { email: string; name: string }) => {
    const { invite, error } = await AdminService.inviteAdmin({
      ...formData, 
      role: 'admin',
      invited_by: currentUser.id
    });

    if (error) {
      alert(`Failed to invite admin: ${error}`);
      return;
    }

    alert('Admin invite sent successfully!');
    setIsInviteModalOpen(false);
    loadData();
  };

  const handleApproveAdmin = async (adminId: string) => {
    const { success, error } = await AdminService.approveAdmin(adminId, currentUser.id);
    
    if (error) {
      alert(`Failed to approve admin: ${error}`);
      return;
    }

    alert('Admin approved successfully!');
    loadData();
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    const { success, error } = await AdminService.deleteAdmin(adminId);
    
    if (error) {
      alert(`Failed to delete admin: ${error}`);
      return;
    }

    alert('Admin deleted successfully!');
    loadData();
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      master_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    };
    return colors[role as keyof typeof colors] || colors.admin;
  };

  const getStatusBadge = (isApproved: boolean) => {
    return isApproved 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  const AdminCard = ({ admin }: { admin: UserType }) => (
    <Card key={admin.id} className="hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Shield className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {admin.name}
              </h3>
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                getRoleBadge(admin.role)
              )}>
                {admin.role === 'master_admin' ? 'Master Admin' : 'Admin'}
              </span>
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                getStatusBadge(admin.is_approved)
              )}>
                {admin.is_approved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{admin.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Joined: {formatDate(admin.created_at)}</span>
              </div>
              {admin.approved_at && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approved: {formatDate(admin.approved_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!admin.is_approved && currentUser.role === 'master_admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleApproveAdmin(admin.id)}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedAdmin(admin)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          {admin.role !== 'master_admin' && currentUser.role === 'master_admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteAdmin(admin.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  const InviteCard = ({ invite }: { invite: AdminInvite }) => (
    <Card key={invite.id} className="hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
            <Mail className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {invite.email}
              </h3>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                Pending
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Invited: {formatDate(invite.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span>Expires: {formatDate(invite.expires_at)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Resend invite functionality
              alert('Invite resent!');
            }}
          >
            <Mail className="w-4 h-4 mr-1" />
            Resend
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage admin users and permissions
            </p>
          </div>
          {currentUser.role === 'master_admin' && (
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Admin
            </Button>
          )}
        </div>

        {/* Search */}
        <Card>
          <Input
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </Card>

        {/* Unapproved Admins */}
        {unapprovedAdmins.length > 0 && currentUser.role === 'master_admin' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pending Approvals ({unapprovedAdmins.length})
            </h2>
            <div className="space-y-4">
              {unapprovedAdmins.map((admin) => (
                <AdminCard key={admin.id} admin={admin} />
              ))}
            </div>
          </div>
        )}

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pending Invites ({pendingInvites.length})
            </h2>
            <div className="space-y-4">
              {pendingInvites.map((invite) => (
                <InviteCard key={invite.id} invite={invite} />
              ))}
            </div>
          </div>
        )}

        {/* All Admins */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Admins ({filteredAdmins.length})
          </h2>
          <div className="space-y-4">
            {filteredAdmins.map((admin) => (
              <AdminCard key={admin.id} admin={admin} />
            ))}
          </div>
        </div>

        {filteredAdmins.length === 0 && !loading && (
          <Card>
            <div className="text-center py-6">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No admins found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No admins match your search.' : 'No admins have been added yet.'}
              </p>
            </div>
          </Card>
        )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invite New Admin
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleInviteAdmin({
                email: formData.get('email') as string,
                name: formData.get('name') as string,
              });
            }}>
              <div className="space-y-4">
                <Input
                  name="name"
                  placeholder="Full Name"
                  required
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                />
                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1">
                    Send Invite
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
} 