// @ts-nocheck

'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase-client';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function handlePasswordRequest(prevState: any, formData: FormData) {
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'La dirección de correo electrónico no es válida.',
    };
  }

  const { email } = validatedFields.data;

  try {
    // Construct the redirect URL. It's important that this URL is registered
    // in your Supabase project's auth settings under "Redirect URLs".
    const redirectUrl = new URL(
      '/password-reset',
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    ).toString();
      
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.',
    };
  } catch (error: any) {
    console.error('Password reset request error:', error);
    // Return a generic message to avoid disclosing whether an email exists in the system.
    return {
      success: true,
      message: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.',
    };
  }
}
