import { ActionResponse } from '@/types/auth.type'

export const requestGroup = async (
  prevState: ActionResponse | null,
  formData: FormData
) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log(formData)

  return {
    success: true,
    message: 'success',
  }
}
