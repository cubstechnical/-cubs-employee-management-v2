import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleApiError } from '../../../../../../lib/api/middleware';
import { supabase } from '../../../../../../lib/supabase/client';
import { BackblazeService } from '../../../../../../lib/services/backblaze'; 