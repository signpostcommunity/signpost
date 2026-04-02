import * as React from 'react'
import { SignpostEmail } from './SignpostEmail'
import { EmailParagraph } from './components'

interface CustomEmailProps {
  preview: string
  bodyParagraphs: string[]
}

export function CustomEmail({ preview, bodyParagraphs }: CustomEmailProps) {
  return (
    <SignpostEmail preview={preview}>
      {bodyParagraphs.map((p, i) => (
        <EmailParagraph key={i}>{p}</EmailParagraph>
      ))}
    </SignpostEmail>
  )
}

export default CustomEmail
