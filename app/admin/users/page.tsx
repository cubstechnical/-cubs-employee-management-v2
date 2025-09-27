'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from('profiles').select('id,email,full_name,role,approved_by,created_at').order('created_at', { ascending: false });
    if (error) { toast.error(error.message); return; }
    setUsers(data || []);
  };

  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!email || !password) { toast.error('Email and password required'); return; }
    setLoading(true);
    try {
      // For mobile app, show that server-side implementation is needed
      console.log('Admin provisioning request (client-side):', { email, password });
      toast('Admin provisioning requires server-side implementation', { icon: 'ℹ️' });
      setEmail('');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = async (targetEmail: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) { toast.error(error.message); return; }
      toast.success('Reset email sent');
    } catch {
      toast.error('Failed to send reset email');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-4 space-y-3">
        <h2 className="text-xl font-semibold">Invite Admin</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="admin@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <Input placeholder="Temporary password" value={password} onChange={e=>setPassword(e.target.value)} />
          <Button onClick={invite} loading={loading}>Create</Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Admins</h2>
        <div className="space-y-2">
          {users.filter(u => u.role === 'admin').map(u => (
            <div key={u.id} className="flex items-center justify-between border-b py-2">
              <div>
                <div className="font-medium">{u.full_name || u.email}</div>
                <div className="text-sm text-gray-500">{u.email}</div>
              </div>
              <div className="space-x-2">
                <Button variant="secondary" onClick={() => reset(u.email)}>Send Reset</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

