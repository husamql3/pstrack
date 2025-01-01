'use client'

import { useMemo, useState } from 'react'
import { Check, Eye, EyeOff, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const InputPassword = () => {
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState<boolean>(false)

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: 'At least 8 characters' },
      { regex: /[0-9]/, text: 'At least 1 number' },
      { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
      { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
    ]

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }))
  }

  const strength = checkStrength(password)

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length
  }, [strength])

  const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-border'
    if (score <= 1) return 'bg-red-500'
    if (score <= 2) return 'bg-orange-500'
    if (score === 3) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getStrengthText = (score: number) => {
    if (score === 0) return 'Enter a password'
    if (score <= 2) return 'Weak password'
    if (score === 3) return 'Medium password'
    return 'Strong password'
  }

  return (
    <div>
      {/* Password input field with toggle visibility button */}
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            className="pe-9"
            name="password"
            placeholder="Enter password"
            type={isVisible ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={strengthScore < 4}
            aria-describedby="password-strength"
          />
          <button
            className="text-muted-foreground/80 focus-visible:outline-ring/70 hover:text-foreground absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg outline-offset-2 transition-colors focus:z-10 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <EyeOff
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            ) : (
              <Eye
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>

      {/* Password strength indicator */}
      <div
        className="bg-border mb-2 mt-3 h-1 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={strengthScore}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Password strength"
      >
        <div
          className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
          style={{ width: `${(strengthScore / 4) * 100}%` }}
        ></div>
      </div>

      {/* Password strength description */}
      <p
        id="password-strength"
        className="text-foreground mb-2 text-sm font-medium"
      >
        {getStrengthText(strengthScore)}. Must contain:
      </p>

      {/* Password requirements list */}
      <ul
        className="space-y-1.5"
        aria-label="Password requirements"
      >
        {strength.map((req, index) => (
          <li
            key={index}
            className="flex items-center gap-2"
          >
            {req.met ? (
              <Check
                size={16}
                className="text-emerald-500"
                aria-hidden="true"
              />
            ) : (
              <X
                size={16}
                className="text-muted-foreground/80"
                aria-hidden="true"
              />
            )}
            <span className={`text-xs ${req.met ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {req.text}
              <span className="sr-only">
                {req.met ? ' - Requirement met' : ' - Requirement not met'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
