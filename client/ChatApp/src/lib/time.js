const sameDay = (a, b) => a.toDateString() === b.toDateString()

const yesterdayOf = (date) => {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return d
}

// "14:05"
export const clockTime = (value) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// "Today", "Yesterday" or "Mon, Oct 20"
export const dayLabel = (value) => {
  const date = new Date(value)
  const now = new Date()
  if (sameDay(date, now)) return 'Today'
  if (sameDay(date, yesterdayOf(now))) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

// short label for the friend list: "now", "5m", "3h", "Yesterday", "Oct 20"
export const shortAgo = (value) => {
  const date = new Date(value)
  const minutes = Math.floor((Date.now() - date) / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (sameDay(date, new Date())) return `${Math.floor(minutes / 60)}h`
  if (sameDay(date, yesterdayOf(new Date()))) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
