const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface RestClientOptions {
  useServiceRole?: boolean
}

interface SupabaseResult<T> {
  data: T | null;
  error: any | null;
}

export function createRestClient(options: RestClientOptions = {}) {
  const apiKey = options.useServiceRole ? SERVICE_ROLE_KEY : ANON_KEY

  return {
    auth: {
      getUser: async (): Promise<SupabaseResult<{ user: any }>> => {
        try {
          const { cookies } = await import("next/headers")
          const cookieStore = await cookies()
          const token = cookieStore.get("sb-auth-token")?.value

          if (!token) {
            return { data: { user: null }, error: null }
          }

          const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            return { data: { user: null }, error: null }
          }

          const user = await response.json()
          return { data: { user }, error: null }
        } catch (error) {
          return { data: { user: null }, error: null }
        }
      },
      admin: {
        createUser: async (userData: {
          email: string
          password: string
          email_confirm?: boolean
          user_metadata?: any
        }): Promise<SupabaseResult<{ user: any }>> => {
          try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                email: userData.email,
                password: userData.password,
                email_confirm: userData.email_confirm ?? true,
                user_metadata: userData.user_metadata || {},
              }),
            })

            if (!response.ok) {
              const error = await response.json()
              return {
                data: null,
                error: { message: error.error_description || error.message || "Failed to create user" },
              }
            }

            const data = await response.json()
            return { data: { user: data }, error: null }
          } catch (error) {
            return { data: null, error: { message: String(error) } }
          }
        },
        listUsers: async (): Promise<SupabaseResult<{ users: any[] }>> => {
          try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
              method: "GET",
              headers: {
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
              },
            })

            if (!response.ok) {
              return { data: { users: [] }, error: null }
            }

            const data = await response.json()
            return { data: { users: data.users || [] }, error: null }
          } catch (error) {
            return { data: { users: [] }, error: null }
          }
        },
        updateUserById: async (userId: string, updates: { user_metadata?: any; email?: string }): Promise<SupabaseResult<{ user: any }>> => {
          try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify(updates),
            })

            if (!response.ok) {
              const error = await response.json()
              return {
                data: null,
                error: { message: error.error_description || error.message || "Failed to update user" },
              }
            }

            const data = await response.json()
            return { data: { user: data }, error: null }
          } catch (error) {
            return { data: null, error: { message: String(error) } }
          }
        },
      },
    },
    from: (table: string) => ({
      select: (columns = "*") => ({
        eq: (column: string, value: any) => ({
          maybeSingle: async (): Promise<SupabaseResult<any>> => {
            try {
              const response = await fetch(
                `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`,
                {
                  headers: {
                    apikey: apiKey,
                    Authorization: `Bearer ${apiKey}`,
                  },
                },
              )

              if (!response.ok) {
                return { data: null, error: null }
              }

              const data = await response.json()
              return { data: data[0] || null, error: null }
            } catch (error) {
              return { data: null, error: null }
            }
          },
          order: <T>(orderColumn: string, options: { ascending: boolean }): Promise<SupabaseResult<T[]>> => {
            return new Promise(async (resolve) => {
              try {
                const order = options.ascending ? "asc" : "desc"
                const response = await fetch(
                  `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&order=${orderColumn}.${order}`,
                  {
                    headers: {
                      apikey: apiKey,
                      Authorization: `Bearer ${apiKey}`,
                    },
                  },
                )

                if (!response.ok) {
                  resolve({ data: null, error: null })
                  return
                }

                const data = await response.json()
                resolve({ data, error: null })
              } catch (error) {
                resolve({ data: null, error: null })
              }
            })
          },
        }),
      }),
      insert: <T>(data: T): Promise<SupabaseResult<any>> => {
        return new Promise(async (resolve) => {
          try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
                Prefer: "return=minimal",
              },
              body: JSON.stringify(data),
            })

            if (!response.ok) {
              const errorText = await response.text()
              let errorObj: any = { message: "Insert failed" }
              try { errorObj = JSON.parse(errorText) } catch { errorObj.message = errorText }
              console.error(`[rest-client] insert ${table} failed:`, response.status, errorObj)
              resolve({ error: { message: errorObj.message || errorObj.details || errorText }, data: null })
              return
            }

            resolve({ error: null, data: null })
          } catch (error) {
            console.error(`[rest-client] insert ${table} exception:`, error)
            resolve({ error: { message: String(error) }, data: null })
          }
        })
      },
      upsert: <T>(data: T, options?: any): Promise<SupabaseResult<any>> => {
        return new Promise(async (resolve) => {
          try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=id`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
                Prefer: "resolution=merge-duplicates",
              },
              body: JSON.stringify(data),
            })

            if (!response.ok) {
              const error = await response.json()
              resolve({ error: { message: error.message || "Upsert failed" }, data: null })
              return
            }

            resolve({ error: null, data: null })
          } catch (error) {
            resolve({ error: { message: String(error) }, data: null })
          }
        })
      },
      update: <T>(data: T) => ({
        eq: (column: string, value: any): Promise<SupabaseResult<any>> => {
          return new Promise(async (resolve) => {
            try {
              const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  apikey: apiKey,
                  Authorization: `Bearer ${apiKey}`,
                  Prefer: "return=minimal",
                },
                body: JSON.stringify(data),
              })

              if (!response.ok) {
                const errorText = await response.text()
                let errorObj: any = { message: "Update failed" }
                try { errorObj = JSON.parse(errorText) } catch { errorObj.message = errorText }
                console.error(`[rest-client] update ${table} failed:`, response.status, errorObj)
                resolve({ error: { message: errorObj.message || errorObj.details || errorText }, data: null })
                return
              }

              resolve({ error: null, data: null })
            } catch (error) {
              console.error(`[rest-client] update ${table} exception:`, error)
              resolve({ error: { message: String(error) }, data: null })
            }
          })
        },
      }),
    }),
  }
}
