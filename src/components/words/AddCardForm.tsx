'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Info } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface AddCardFormProps {
  onSubmit: (cardData: CardFormData) => Promise<void>
  onCancel?: () => void
}

export interface CardFormData {
  noteTypeSlug: string
  fields: Record<string, any>
  generateReverse?: boolean
  wordId?: string
  tags?: string[]
}

const NOTE_TYPES = [
  {
    slug: 'basic',
    label: 'Basic',
    description: 'Simple front/back card. Best for vocabulary, definitions, and facts.',
    icon: '📝',
    fields: [
      { name: 'front', label: 'Front (Question)', type: 'text', required: true, placeholder: 'e.g., "What is the capital of France?"' },
      { name: 'back', label: 'Back (Answer)', type: 'textarea', required: true, placeholder: 'e.g., "Paris"' },
      { name: 'extra', label: 'Extra Info (Optional)', type: 'textarea', required: false, placeholder: 'Additional context, pronunciation, etc.' }
    ],
    supportsReverse: true
  },
  {
    slug: 'cloze',
    label: 'Cloze Deletion',
    description: 'Fill-in-the-blank style. Perfect for learning in context.',
    icon: '📋',
    fields: [
      { name: 'text', label: 'Text with Cloze Deletions', type: 'textarea', required: true, placeholder: 'Use {{c1::answer}} syntax\ne.g., "The {{c1::capital}} of France is {{c2::Paris}}"' },
      { name: 'extra', label: 'Extra Info (Optional)', type: 'text', required: false, placeholder: 'Additional context' }
    ],
    supportsReverse: false
  },
  {
    slug: 'typing',
    label: 'Typing Answer',
    description: 'Requires typing the exact answer. Great for spelling practice.',
    icon: '⌨️',
    fields: [
      { name: 'front', label: 'Question', type: 'text', required: true, placeholder: 'e.g., "How do you spell \'necessary\'?"' },
      { name: 'back', label: 'Answer', type: 'text', required: true, placeholder: 'e.g., "necessary"' },
      { name: 'extra', label: 'Hint (Optional)', type: 'text', required: false, placeholder: 'e.g., "one collar, two sleeves"' }
    ],
    supportsReverse: false
  }
]

/**
 * Form for creating new flashcards with different card types
 */
export function AddCardForm({ onSubmit, onCancel }: AddCardFormProps) {
  const [selectedType, setSelectedType] = useState('basic')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [generateReverse, setGenerateReverse] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentType = NOTE_TYPES.find(t => t.slug === selectedType) || NOTE_TYPES[0]

  // Reset fields when card type changes
  useEffect(() => {
    setFields({})
    setGenerateReverse(false)
    setError(null)
  }, [selectedType])

  const handleFieldChange = (fieldName: string, value: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: value
    }))
    setError(null)
  }

  const validateFields = (): boolean => {
    for (const field of currentType.fields) {
      if (field.required && !fields[field.name]?.trim()) {
        setError(`${field.label} is required`)
        return false
      }
    }

    // Validate cloze syntax
    if (selectedType === 'cloze') {
      const text = fields.text || ''
      const clozeRegex = /\{\{c\d+::[^}]+\}\}/g
      if (!clozeRegex.test(text)) {
        setError('Cloze text must contain at least one cloze deletion in format: {{c1::answer}}')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateFields()) {
      return
    }

    setIsSubmitting(true)

    try {
      const cardData: CardFormData = {
        noteTypeSlug: selectedType,
        fields: fields,
        generateReverse: currentType.supportsReverse ? generateReverse : false
      }

      await onSubmit(cardData)

      // Reset form on success
      setFields({})
      setGenerateReverse(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Card Type</Label>
        <RadioGroup value={selectedType} onValueChange={setSelectedType}>
          <div className="grid gap-3">
            {NOTE_TYPES.map((type) => (
              <Label
                key={type.slug}
                htmlFor={type.slug}
                className="cursor-pointer"
              >
                <Card className={`transition-all hover:border-primary ${
                  selectedType === type.slug ? 'border-primary bg-primary/5' : ''
                }`}>
                  <CardHeader className="p-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={type.slug} id={type.slug} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{type.icon}</span>
                          <CardTitle className="text-base">{type.label}</CardTitle>
                        </div>
                        <CardDescription className="mt-1 text-xs">
                          {type.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Dynamic Fields */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Card Content</Label>
        {currentType.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                value={fields[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={selectedType === 'cloze' ? 6 : 4}
                className="resize-none"
              />
            ) : (
              <Input
                id={field.name}
                type="text"
                value={fields[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {/* Cloze Syntax Help */}
      {selectedType === 'cloze' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Cloze Deletion Syntax:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Use <code className="bg-gray-100 px-1 rounded">{'{{c1::answer}}'}</code> for deletions</li>
              <li>Multiple deletions: <code className="bg-gray-100 px-1 rounded">{'{{c1::first}} and {{c2::second}}'}</code></li>
              <li>Same number for overlapping: <code className="bg-gray-100 px-1 rounded">{'{{c1::word1}} {{c1::word2}}'}</code></li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Reverse Card Option */}
      {currentType.supportsReverse && (
        <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
          <Checkbox
            id="generateReverse"
            checked={generateReverse}
            onCheckedChange={(checked) => setGenerateReverse(checked === true)}
          />
          <Label
            htmlFor="generateReverse"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Generate reverse card (Back → Front)
          </Label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Card{generateReverse ? 's' : ''}
            </>
          )}
        </Button>
      </div>

      {/* Preview Text */}
      {generateReverse && (
        <p className="text-xs text-center text-gray-500">
          This will create 2 cards: one forward and one reverse
        </p>
      )}
    </form>
  )
}
