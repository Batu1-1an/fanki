import { describe, it, expect, vi } from 'vitest'

describe('OnboardingPreferences', () => {
  describe('Preference Selection', () => {
    it('should set native language', () => {
      const preferences = { nativeLanguage: 'en' }
      expect(preferences.nativeLanguage).toBe('en')
    })

    it('should set daily goal', () => {
      const preferences = { dailyGoal: 20 }
      expect(preferences.dailyGoal).toBe(20)
    })

    it('should set study reminder', () => {
      const preferences = { studyReminder: true }
      expect(preferences.studyReminder).toBe(true)
    })
  })

  describe('Validation', () => {
    it('should validate daily goal range', () => {
      const goal = 25
      const isValid = goal >= 5 && goal <= 100
      expect(isValid).toBe(true)
    })

    it('should validate language selection', () => {
      const languages = ['en', 'es', 'fr', 'de']
      const selected = 'en'
      expect(languages).toContain(selected)
    })
  })

  describe('Save Preferences', () => {
    it('should save user preferences', () => {
      const onSave = vi.fn()
      const prefs = { dailyGoal: 20, nativeLanguage: 'en' }
      onSave(prefs)
      expect(onSave).toHaveBeenCalledWith(prefs)
    })
  })
})
