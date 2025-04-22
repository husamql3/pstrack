import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export type FormDataType = {
  name: string
  username: string
  lc_username: string
  gh_username: string
}

export const RequestForm = ({
  formData,
  handleInputChange,
  handleRequest,
  isPending,
  groupId,
}: {
  formData: FormDataType
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRequest: (e: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
  groupId: string
}) => {
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

  return (
    <div>
      <h3 className="mb-2 font-medium text-neutral-100">
        Request to join <span className="font-semibold">Group {groupId.padStart(2, '0')}</span>
      </h3>
      <form
        onSubmit={handleRequest}
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
              name={id}
              value={formData[id as keyof FormDataType]}
              onChange={handleInputChange}
              placeholder={placeholder}
              required={required}
              disabled={isPending}
              autoComplete="off"
            />
          </div>
        ))}
      </form>
    </div>
  )
}
