import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export type FormDataType = {
  name: string
  username: string
  lc_username: string
  gh_username: string
}

const RequestToJoinSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long' }).max(100),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(100)
    .refine((val) => !val.includes(' '), {
      message: 'Username cannot contain spaces',
    }),
  lc_username: z.string().min(1, { message: 'LeetCode username is required.' }),
  gh_username: z.string().optional(),
})

type RequestToJoinSchemaType = z.infer<typeof RequestToJoinSchema>

export const RequestForm = ({
  formData,
  handleInputChange,
  handleRequest,
  isPending,
  groupId,
}: {
  formData: FormDataType
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRequest: (data: RequestToJoinSchemaType) => void
  isPending: boolean
  groupId: string
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestToJoinSchemaType>({
    resolver: zodResolver(RequestToJoinSchema),
    defaultValues: formData,
    mode: 'onSubmit',
  })

  const formFields = [
    {
      id: 'name',
      label: 'Name',
      required: true,
      placeholder: 'Enter your name',
    },
    {
      id: 'username',
      label: 'Username',
      required: true,
      placeholder: 'will be visible to the table',
    },
    {
      id: 'lc_username',
      label: 'LeetCode Username',
      required: true,
      placeholder: 'Enter your Leetcode username',
    },
    {
      id: 'gh_username',
      label: 'GitHub Username',
      required: false,
      placeholder: 'Enter your GitHub username',
    },
  ]

  // Sync input changes with parent state
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e)
    // Optionally, validate on change:
    // trigger(e.target.name as keyof RequestToJoinSchemaType)
  }

  return (
    <div className="w-full">
      <h3 className="mb-2 text-xl font-medium text-neutral-100">
        Request to join <span className="font-semibold">Group {groupId.padStart(2, '0')}</span>
      </h3>
      <form
        onSubmit={handleSubmit(handleRequest)}
        id="request-to-join-form"
        className="flex flex-col gap-5 pt-4 pb-1"
      >
        {formFields.map(({ id, label, required, placeholder }) => (
          <div
            key={id}
            className="flex flex-col gap-2"
          >
            <Label htmlFor={id}>
              {label}
              {required && <span className="text-sm text-red-500">*</span>}
            </Label>
            <Input
              id={id}
              {...register(id as keyof RequestToJoinSchemaType)}
              name={id}
              value={formData[id as keyof FormDataType]}
              onChange={onInputChange}
              placeholder={placeholder}
              required={required}
              disabled={isPending}
              autoComplete="off"
            />
            {errors[id as keyof RequestToJoinSchemaType] && (
              <p className="text-sm text-red-500">{errors[id as keyof RequestToJoinSchemaType]?.message as string}</p>
            )}
          </div>
        ))}
      </form>
    </div>
  )
}
