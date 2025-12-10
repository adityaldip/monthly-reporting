import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { UserRegister } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const body: UserRegister = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Register user dengan Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || '',
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Gagal membuat user' },
        { status: 400 }
      );
    }

    // User record akan otomatis dibuat oleh trigger di database

    return NextResponse.json(
      { 
        message: 'Registrasi berhasil',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

