import { mediaUrl } from '../lib/api'

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-xl',
}

export default function Avatar({ user, size = 'md' }) {
  const src = mediaUrl(user?.user_picture)
  const classes = `${SIZES[size]} shrink-0 rounded-full object-cover`

  if (src) return <img src={src} alt={user.username} className={classes} />

  return (
    <span
      className={`${classes} flex items-center justify-center bg-indigo-100 font-semibold uppercase text-indigo-700`}
    >
      {user?.username?.slice(0, 2) || '?'}
    </span>
  )
}
