/**
 * TypingIndicator Component Tests
 *
 * Tests for typing indicator functionality
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { TypingIndicator, InlineTypingIndicator } from '../typing-indicator'
import type { TypingUser } from '@/types/message'

describe('TypingIndicator', () => {
  const createTypingUser = (id: string, name: string): TypingUser => ({
    id,
    username: name.toLowerCase(),
    displayName: name,
  })

  describe('InlineTypingIndicator', () => {
    it('should not render when no users are typing', () => {
      const { container } = render(<InlineTypingIndicator users={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('should show single user typing', () => {
      const users = [createTypingUser('1', 'Alice')]
      render(<InlineTypingIndicator users={users} />)

      expect(screen.getByText(/alice is typing/i)).toBeInTheDocument()
    })

    it('should show two users typing', () => {
      const users = [createTypingUser('1', 'Alice'), createTypingUser('2', 'Bob')]
      render(<InlineTypingIndicator users={users} />)

      expect(screen.getByText(/alice and bob are typing/i)).toBeInTheDocument()
    })

    it('should show three users typing', () => {
      const users = [
        createTypingUser('1', 'Alice'),
        createTypingUser('2', 'Bob'),
        createTypingUser('3', 'Charlie'),
      ]
      render(<InlineTypingIndicator users={users} />)

      expect(screen.getByText(/alice, bob, and charlie are typing/i)).toBeInTheDocument()
    })

    it('should show "several people" when more than 3 users', () => {
      const users = [
        createTypingUser('1', 'Alice'),
        createTypingUser('2', 'Bob'),
        createTypingUser('3', 'Charlie'),
        createTypingUser('4', 'Dave'),
      ]
      render(<InlineTypingIndicator users={users} />)

      expect(screen.getByText(/several people are typing/i)).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const users = [createTypingUser('1', 'Alice')]
      const { container } = render(<InlineTypingIndicator users={users} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should show animated dots', () => {
      const users = [createTypingUser('1', 'Alice')]
      render(<InlineTypingIndicator users={users} />)

      const dots = screen.getAllByTestId(/typing-dot/i)
      expect(dots.length).toBeGreaterThan(0)
    })
  })

  describe('TypingIndicator', () => {
    it('should render the animated dots', () => {
      render(<TypingIndicator />)

      const container = screen.getByTestId('typing-indicator')
      expect(container).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<TypingIndicator className="custom-class" />)

      const container = screen.getByTestId('typing-indicator')
      expect(container).toHaveClass('custom-class')
    })
  })
})
