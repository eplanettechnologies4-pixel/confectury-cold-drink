import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, department, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder') || serviceKey.includes('placeholder')) {
      return NextResponse.json(
        {
          success: false,
          needsSql: true,
          message: 'Supabase service role key is not configured in .env.local. Please copy and run the generated SQL query in your Supabase SQL Editor.',
        },
        { status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const cleanEmail = email.trim().toLowerCase();
    const userRole = role || 'Admin';
    const userDept = department || 'Management';
    const userPhone = phone || '';

    // Create user in Supabase Auth
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name.trim(),
        role: userRole,
        department: userDept,
        phone: userPhone,
      },
    });

    if (createError) {
      return NextResponse.json(
        { success: false, message: createError.message },
        { status: 400 }
      );
    }

    const createdUserId = userData?.user?.id;

    if (createdUserId) {
      // Upsert into staff_profiles to ensure synchronization
      const empId = 'AT-' + new Date().getFullYear().toString().slice(-2) + Math.floor(1000 + Math.random() * 9000);
      await supabase.from('staff_profiles').upsert(
        {
          user_id: createdUserId,
          employee_id: empId,
          name: name.trim(),
          email: cleanEmail,
          phone: userPhone,
          role: userRole,
          department: userDept,
          status: 'Active',
        },
        { onConflict: 'email' }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${name} (${cleanEmail}) created successfully in Supabase!`,
      user: userData?.user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error while creating user' },
      { status: 500 }
    );
  }
}
