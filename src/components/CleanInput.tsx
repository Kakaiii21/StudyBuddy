// src/components/CleanInput.tsx
import { containsBadWords } from '../utils/contentFilter'


const MSG = "Inappropriate language isn't allowed."
const DEFAULT_MSG_CLASS = 'text-red-500 text-[12px] font-inter'

export function CleanInput({
  value,
  className = '',
  messageClassName = DEFAULT_MSG_CLASS,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  value: string
  messageClassName?: string
}) {
  const bad = containsBadWords(value ?? '')
  return (
    <>
      <input value={value} {...rest} className={`${className} ${bad ? '!border-red-500' : ''}`} />
      {bad && <p className={`mt-1 ${messageClassName}`}>{MSG}</p>}
    </>
  )
}

export function CleanTextarea({
  value,
  className = '',
  messageClassName = DEFAULT_MSG_CLASS,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string
  messageClassName?: string
}) {
  const bad = containsBadWords(value ?? '')
  return (
    <>
      <textarea value={value} {...rest} className={`${className} ${bad ? '!border-red-500' : ''}`} />
      {bad && <p className={`mt-1 ${messageClassName}`}>{MSG}</p>}
    </>
  )
}