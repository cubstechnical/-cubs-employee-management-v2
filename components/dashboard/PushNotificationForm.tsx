'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Send, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PushNotificationForm() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendPush = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !body) {
            toast.error('Title and message are required');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/admin/send-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    body,
                    platform: 'all'
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Sent to ${data.count || 0} devices!`);
                setTitle('');
                setBody('');
            } else {
                toast.error(data.error || 'Failed to send notification');
            }
        } catch (error) {
            toast.error('Error sending notification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSendPush} className="space-y-4">
            <div className="space-y-2">
                <Input
                    label="Notification Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. System Alert"
                    icon={<Smartphone className="w-4 h-4" />}
                />
            </div>
            <div className="space-y-2">
                <Input
                    label="Message Content"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message here..."
                />
            </div>
            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d3194f] hover:bg-[#b01543] text-white"
                icon={<Send className="w-4 h-4" />}
            >
                {loading ? 'Sending...' : 'Send to All Devices'}
            </Button>
        </form>
    );
}
