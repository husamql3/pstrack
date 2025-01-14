// import { ZodError } from 'zod'

// export const fetcher = async <T, B = unknown>(
//   url: string,
//   method: 'GET' | 'POST' | 'PUT' | 'DELETE',
//   body?: B,
//   headers?: Record<string, string>
// ): Promise<T> => {
//   const config: RequestInit = {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//       ...headers,
//     },
//   }

//   if (body) {
//     config.body = JSON.stringify(body)
//   }

//   const response = await fetch(url, config)

//   if (!response.ok) {
//     const errorData = await response.json()

//     if (errorData.error && errorData.error.includes('ZodError')) {
//       throw new ZodError(JSON.parse(errorData.error))
//     }

//     throw new Error(errorData.error || 'Something went wrong')
//   }

//   return response.json()
// }

export async function fetcher<T>(
  url: string,
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}
