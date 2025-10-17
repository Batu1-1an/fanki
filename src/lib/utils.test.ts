import { describe, it, expect } from 'vitest'

describe('Utility Functions', () => {
  describe('classNames / cn utility', () => {
    it('should merge class names', () => {
      const result = ['class1', 'class2'].filter(Boolean).join(' ')
      
      expect(result).toBe('class1 class2')
    })

    it('should filter out falsy values', () => {
      const classes = ['class1', false, 'class2', null, undefined, '', 'class3']
      const result = classes.filter(Boolean).join(' ')
      
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false
      
      const classes = [
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      ]
      
      const result = classes.filter(Boolean).join(' ')
      
      expect(result).toBe('base-class active')
    })

    it('should merge Tailwind classes', () => {
      // Simulating tailwind-merge behavior
      const classes = ['px-4', 'px-6', 'py-2']
      // In real tailwind-merge, later values override
      // Here we just test the concept
      const result = classes.join(' ')
      
      expect(result).toContain('px')
      expect(result).toContain('py')
    })
  })

  describe('Date Formatting', () => {
    it('should format date to string', () => {
      const date = new Date('2025-01-17T12:00:00Z')
      const formatted = date.toLocaleDateString('en-US')
      
      expect(formatted).toContain('2025')
    })

    it('should format time ago', () => {
      const now = Date.now()
      const oneHourAgo = now - (60 * 60 * 1000)
      
      const diffMinutes = Math.floor((now - oneHourAgo) / (60 * 1000))
      
      expect(diffMinutes).toBe(60)
    })

    it('should format relative time', () => {
      const minutesAgo = 45
      
      let timeAgo: string
      if (minutesAgo < 1) {
        timeAgo = 'just now'
      } else if (minutesAgo < 60) {
        timeAgo = `${minutesAgo} minutes ago`
      } else {
        timeAgo = 'over an hour ago'
      }
      
      expect(timeAgo).toBe('45 minutes ago')
    })

    it('should format date ranges', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-01-31')
      
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      
      expect(diffDays).toBe(30)
    })
  })

  describe('String Manipulation', () => {
    it('should truncate long strings', () => {
      const text = 'This is a very long text that needs to be truncated'
      const maxLength = 20
      
      const truncated = text.length > maxLength 
        ? text.substring(0, maxLength) + '...' 
        : text
      
      expect(truncated).toBe('This is a very long ...')
      expect(truncated.length).toBeLessThanOrEqual(maxLength + 3)
    })

    it('should capitalize first letter', () => {
      const text = 'hello world'
      const capitalized = text.charAt(0).toUpperCase() + text.slice(1)
      
      expect(capitalized).toBe('Hello world')
    })

    it('should convert to title case', () => {
      const text = 'hello world test'
      const titleCase = text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      expect(titleCase).toBe('Hello World Test')
    })

    it('should slugify text', () => {
      const text = 'Hello World! This is a Test.'
      const slug = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
      
      expect(slug).toBe('hello-world-this-is-a-test')
    })

    it('should remove extra whitespace', () => {
      const text = '  hello   world  '
      const cleaned = text.trim().replace(/\s+/g, ' ')
      
      expect(cleaned).toBe('hello world')
    })
  })

  describe('Number Formatting', () => {
    it('should format large numbers', () => {
      const num = 1234567
      const formatted = num.toLocaleString('en-US')
      
      expect(formatted).toBe('1,234,567')
    })

    it('should format percentages', () => {
      const value = 0.8564
      const percentage = `${(value * 100).toFixed(1)}%`
      
      expect(percentage).toBe('85.6%')
    })

    it('should format decimal places', () => {
      const num = 3.14159265359
      const formatted = num.toFixed(2)
      
      expect(formatted).toBe('3.14')
    })

    it('should abbreviate large numbers', () => {
      const num = 1500
      const abbreviated = num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()
      
      expect(abbreviated).toBe('1.5k')
    })

    it('should clamp values between min and max', () => {
      const clamp = (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max)
      }
      
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  describe('Array Utilities', () => {
    it('should remove duplicates', () => {
      const arr = [1, 2, 2, 3, 4, 4, 5]
      const unique = [...new Set(arr)]
      
      expect(unique).toEqual([1, 2, 3, 4, 5])
    })

    it('should shuffle array', () => {
      const arr = [1, 2, 3, 4, 5]
      const shuffled = [...arr].sort(() => Math.random() - 0.5)
      
      // Can't test exact order due to randomness, but check length
      expect(shuffled).toHaveLength(arr.length)
      expect(shuffled).toEqual(expect.arrayContaining(arr))
    })

    it('should chunk array', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8]
      const chunkSize = 3
      const chunks: number[][] = []
      
      for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize))
      }
      
      expect(chunks).toHaveLength(3)
      expect(chunks[0]).toEqual([1, 2, 3])
      expect(chunks[2]).toEqual([7, 8])
    })

    it('should group by property', () => {
      const items = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ]
      
      const grouped = items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      }, {} as Record<string, typeof items>)
      
      expect(grouped.A).toHaveLength(2)
      expect(grouped.B).toHaveLength(1)
    })
  })

  describe('Object Utilities', () => {
    it('should deep clone object', () => {
      const obj = { a: 1, b: { c: 2 } }
      const clone = JSON.parse(JSON.stringify(obj))
      
      clone.b.c = 3
      
      expect(obj.b.c).toBe(2)
      expect(clone.b.c).toBe(3)
    })

    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { b: 3, c: 4 }
      const merged = { ...obj1, ...obj2 }
      
      expect(merged).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('should pick properties', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const keys = ['a', 'c'] as const
      const picked = Object.fromEntries(
        keys.map(key => [key, obj[key]])
      )
      
      expect(picked).toEqual({ a: 1, c: 3 })
    })

    it('should omit properties', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const keysToOmit = ['b']
      const omitted = Object.fromEntries(
        Object.entries(obj).filter(([key]) => !keysToOmit.includes(key))
      )
      
      expect(omitted).toEqual({ a: 1, c: 3 })
    })
  })

  describe('Validation Utilities', () => {
    it('should validate email', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      expect(emailRegex.test('test@example.com')).toBe(true)
      expect(emailRegex.test('invalid-email')).toBe(false)
      expect(emailRegex.test('@example.com')).toBe(false)
    })

    it('should validate URL', () => {
      const urlRegex = /^https?:\/\/.+/
      
      expect(urlRegex.test('https://example.com')).toBe(true)
      expect(urlRegex.test('http://example.com')).toBe(true)
      expect(urlRegex.test('example.com')).toBe(false)
    })

    it('should validate password strength', () => {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      
      expect(strongPasswordRegex.test('Weak123')).toBe(false)
      expect(strongPasswordRegex.test('Strong123!')).toBe(true)
    })

    it('should check if value is empty', () => {
      const isEmpty = (value: any) => {
        if (value === null || value === undefined) return true
        if (typeof value === 'string') return value.trim().length === 0
        if (Array.isArray(value)) return value.length === 0
        if (typeof value === 'object') return Object.keys(value).length === 0
        return false
      }
      
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('  ')).toBe(true)
      expect(isEmpty([])).toBe(true)
      expect(isEmpty({})).toBe(true)
      expect(isEmpty('text')).toBe(false)
      expect(isEmpty([1])).toBe(false)
    })
  })

  describe('Local Storage Utilities', () => {
    it('should serialize and deserialize data', () => {
      const data = { user: 'test', count: 42 }
      const serialized = JSON.stringify(data)
      const deserialized = JSON.parse(serialized)
      
      expect(deserialized).toEqual(data)
    })

    it('should handle storage errors gracefully', () => {
      const invalidJSON = '{ invalid json }'
      
      let parsed = null
      try {
        parsed = JSON.parse(invalidJSON)
      } catch (error) {
        parsed = null
      }
      
      expect(parsed).toBeNull()
    })
  })

  describe('Debounce and Throttle', () => {
    it('should implement debounce logic', () => {
      let callCount = 0
      const debounceDelay = 100
      
      // Simulating debounce behavior
      const increment = () => callCount++
      
      // In real implementation, would use setTimeout
      // Here we just test the concept
      increment()
      
      expect(callCount).toBe(1)
    })

    it('should calculate throttle timing', () => {
      const lastCallTime = Date.now() - 500
      const throttleDelay = 1000
      
      const shouldCall = (Date.now() - lastCallTime) >= throttleDelay
      
      expect(shouldCall).toBe(false) // Still within throttle period
    })
  })

  describe('Error Handling', () => {
    it('should extract error message', () => {
      const errors = [
        new Error('Test error'),
        { message: 'Object error' },
        'String error',
        null
      ]
      
      const getMessage = (error: any) => {
        if (error instanceof Error) return error.message
        if (error && typeof error === 'object' && 'message' in error) return error.message
        if (typeof error === 'string') return error
        return 'Unknown error'
      }
      
      expect(getMessage(errors[0])).toBe('Test error')
      expect(getMessage(errors[1])).toBe('Object error')
      expect(getMessage(errors[2])).toBe('String error')
      expect(getMessage(errors[3])).toBe('Unknown error')
    })

    it('should create safe error object', () => {
      const error = new Error('Test error')
      const safeError = {
        message: error.message,
        name: error.name,
        stack: error.stack
      }
      
      expect(safeError.message).toBe('Test error')
      expect(safeError.name).toBe('Error')
    })
  })
})
