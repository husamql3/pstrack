export function calcMaxStreak(submissionCalendar: string): number {
  // Parse the submission calendar JSON string
  const submissions = JSON.parse(submissionCalendar)

  // Convert timestamp (in seconds) to date and filter for current year
  const currentYear = new Date().getFullYear()
  const dateEntries = Object.entries(submissions)
    .map(([timestamp, count]) => ({
      date: new Date(parseInt(timestamp) * 1000),
      count: Number(count),
    }))
    .filter((entry) => entry.date.getFullYear() === currentYear)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  let currentStreak = 0
  let maxStreak = 0

  for (let i = 0; i < dateEntries.length; i++) {
    const current = dateEntries[i]
    const prev = i > 0 ? dateEntries[i - 1] : null

    if (current.count > 0) {
      // If this is the first entry or consecutive day
      if (!prev || current.date.getTime() - prev.date.getTime() === 86400000) {
        currentStreak++
      } else {
        // Reset streak if not consecutive
        currentStreak = 1
      }
      maxStreak = Math.max(maxStreak, currentStreak)
    }
  }

  return maxStreak
}
