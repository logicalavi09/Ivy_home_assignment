import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, message, action, children }) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="empty-icon">
        <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      {message && <p className="muted">{message}</p>}
      {action || children}
    </motion.div>
  )
}