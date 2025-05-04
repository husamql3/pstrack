export const RequestRules = () => {
  return (
    <div>
      <h3 className="mb-4 text-xl font-medium text-neutral-900 dark:text-neutral-100">Welcome to PSTrack!</h3>
      <ul className="space-y-3 text-base text-neutral-700 dark:text-neutral-300">
        <li className="flex items-start">
          <span className="mt-0.5 mr-2 text-xl text-green-500">•</span>
          <span>Join us to improve your problem-solving skills and be consistent with daily challenges.</span>
        </li>
        <li className="flex items-start">
          <span className="mt-0.5 mr-2 text-xl text-green-500">•</span>
          <span>Get a new coding problem every day at 6 AM. Keep practicing to stay sharp!</span>
        </li>
        <li className="flex items-start">
          <span className="mt-0.5 mr-2 text-xl text-yellow-500">•</span>
          <span>
            If you miss 6 problems, we&apos;ll send you an alert. You&apos;ll get one final chance to catch up.
          </span>
        </li>
        <li className="flex items-start">
          <span className="mt-0.5 mr-2 text-xl text-red-500">•</span>
          <span>
            If you don&apos;t solve your problems within one day after the alert, you&apos;ll be removed from the group.
          </span>
        </li>
      </ul>
    </div>
  )
}
