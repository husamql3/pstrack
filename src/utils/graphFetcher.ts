
export const fetcher = async <T, B = unknown>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: B,
  headers?: Record<string, string>
): Promise<T> => {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL')
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error || 'Something went wrong')
    }

    return response.json()
  } catch (error) {
    console.error('Error in fetcher:', error)
    throw error
  }
}
