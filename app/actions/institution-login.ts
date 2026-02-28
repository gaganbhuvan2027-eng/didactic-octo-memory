"use server"

import { createRestClient } from '@/lib/supabase/rest-client'

export async function createInstitutionAdmin(email: string, password: string) {
  try {
    console.log('[v0] Server: Creating institution admin account...')

    const supabaseAdmin = createRestClient({ useServiceRole: true })

    // Validate email domain
    const emailDomain = email.split("@")[1].toLowerCase();
    const { data: institution, error: institutionError } = await supabaseAdmin
      .from("institutions")
      .select("id, name")
      .eq("email_domain", emailDomain)
      .maybeSingle()

    if (institutionError || !institution) {
      console.log('[v0] Server: Invalid institution domain:', emailDomain)
      return { success: false, error: "This email domain is not registered with any institution" }
    }

    console.log('[v0] Server: Found institution:', institution.name)

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers.users.find((u: any) => u.email === email);

    if (userExists) {
      console.log('[v0] Server: User already exists in auth, upserting profile...')

      const { error: upsertError } = await (supabaseAdmin.from("users").upsert(
        {
          id: userExists.id,
          email,
          user_type: "institution_admin",
          institution_id: institution.id,
          name: email.split("@")[0],
        },
        {
          onConflict: "id",
        },
      )) as Promise<any>;

      if (upsertError) {
        console.log('[v0] Server: Error upserting user profile:', upsertError)
        return { success: false, error: "Failed to create/update user profile" }
      }
      console.log('[v0] Server: User profile upserted successfully')

      return {
        success: true,
        email,
        password,
        isExisting: true,
      }
    }

    // Create user with admin API - this bypasses email confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email for testing
      user_metadata: {
        email,
        user_type: "institution_admin",
        institution_id: institution.id,
      },
    })

    if (error) {
      console.log('[v0] Server: Institution admin creation error:', error)
      return { success: false, error: error.message }
    }

    console.log('[v0] Server: Institution admin created successfully')

    const { error: upsertError } = await (supabaseAdmin.from("users").upsert(
      {
        id: data.user.id,
        email,
        user_type: "institution_admin",
        institution_id: institution.id,
        name: email.split("@")[0],
      },
      {
        onConflict: "id",
      },
    )) as Promise<any>;

    if (upsertError) {
      console.log('[v0] Server: Error upserting user profile:', upsertError)
      // Don't fail the whole operation, user can still login
    } else {
      console.log('[v0] Server: User profile upserted successfully')
    }

    // Return credentials so client can sign in
    return {
      success: true,
      email,
      password,
      isExisting: false,
    }
  } catch (err: any) {
    console.log('[v0] Server: Unexpected error:', err)
    return { success: false, error: err.message || 'Failed to create institution admin account' }
  }
}

export async function createSuperAdmin(email: string, password: string) {
  try {
    console.log('[v0] Server: Creating super admin account...')

    const supabaseAdmin = createRestClient({ useServiceRole: true })

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers.users.find((u: any) => u.email === email);

    if (userExists) {
      console.log('[v0] Server: User already exists in auth, updating role to super_admin...')

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userExists.id,
        {
          user_metadata: {
            ...userExists.user_metadata,
            role: "super_admin",
          },
        },
      )

      if (updateError) {
        console.log('[v0] Server: Error updating user role:', updateError)
        return { success: false, error: "Failed to update user role" }
      }
      console.log('[v0] Server: User role updated successfully to super_admin')

      // Ensure user exists in public.users table with the correct role
      const { error: upsertError } = await (supabaseAdmin.from("users").upsert(
        {
          id: userExists.id,
          email,
          user_type: "super_admin",
          name: email.split("@")[0],
        },
        {
          onConflict: "id",
        },
      )) as Promise<any>;

      if (upsertError) {
        console.log('[v0] Server: Error upserting user profile with super_admin type:', upsertError)
      } else {
        console.log('[v0] Server: User profile upserted successfully with super_admin type')
      }

      return {
        success: true,
        email,
        password,
        isExisting: true,
        userId: userExists.id, // Return existing user's ID
        message: "Super admin user updated successfully.",
      }
    }

    // Create user with admin API - this bypasses email confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email for testing
      user_metadata: {
        email,
        role: "super_admin",
        user_type: "super_admin", // Also set user_type in metadata for consistency
      },
    })

    if (error) {
      console.log('[v0] Server: Super admin creation error:', error)
      return { success: false, error: error.message }
    }

    console.log('[v0] Server: Super admin created successfully')

    const { error: upsertError } = await (supabaseAdmin.from("users").upsert(
      {
        id: data.user.id,
        email,
        user_type: "super_admin",
        name: email.split("@")[0],
      },
      {
        onConflict: "id",
      },
    )) as Promise<any>;

    if (upsertError) {
      console.log('[v0] Server: Error upserting user profile for super admin:', upsertError)
    } else {
      console.log('[v0] Server: User profile upserted successfully for super admin')
    }

    // Return credentials so client can sign in
    return {
      success: true,
      email,
      password,
      isExisting: false,
      userId: data.user.id, // Return new user's ID
      message: "Super admin user created successfully.",
    }
  } catch (err: any) {
    console.log('[v0] Server: Unexpected error during super admin creation:', err)
    return { success: false, error: err.message || 'Failed to create super admin account' }
  }
}
