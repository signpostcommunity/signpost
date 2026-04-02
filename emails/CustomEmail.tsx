import * as React from 'react'
import { Text } from '@react-email/components'
import { SignpostEmail } from './SignpostEmail'

interface CustomEmailProps {
  preview: string
  bodyParagraphs: string[]
}

const paragraphStyle: React.CSSProperties = {
  color: '#c8cdd8',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

export function CustomEmail({ preview, bodyParagraphs }: CustomEmailProps) {
  return (
    <SignpostEmail preview={preview}>
      {bodyParagraphs.map((p, i) => (
        <Text key={i} style={paragraphStyle}>{p}</Text>
      ))}
    </SignpostEmail>
  )
}

export default CustomEmail
