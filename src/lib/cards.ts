import { createClientComponentClient } from './supabase/client'
import { Card, Note } from '@/types'

const supabase = createClientComponentClient()

export type NoteTypeSlug = 'default' | 'basic' | 'basic_reverse' | 'typing' | 'cloze' | 'image_occlusion'

export interface CreateNoteParams {
  userId: string
  noteTypeSlug: NoteTypeSlug
  fields: Record<string, any>
  wordId?: string
  tags?: string[]
}

export interface NoteType {
  id: string
  slug: string
  label: string
  description: string | null
  supports_reverse: boolean
  requires_typing: boolean
  supports_cloze: boolean
  supports_image_occlusion: boolean
  default_fields: Array<{
    name: string
    type: string
    required: boolean
  }>
  default_options: Record<string, any>
}

/**
 * Get all available note types
 */
export async function getNoteTypes(): Promise<{
  data: NoteType[] | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('note_types')
      .select('*')
      .order('slug')

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get a specific note type by slug
 */
export async function getNoteTypeBySlug(slug: NoteTypeSlug): Promise<{
  data: NoteType | null
  error: any
}> {
  try {
    const { data, error } = await supabase
      .from('note_types')
      .select('*')
      .eq('slug', slug)
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Create a note and generate its cards
 */
export async function createNoteWithCards({
  userId,
  noteTypeSlug,
  fields,
  wordId,
  tags = []
}: CreateNoteParams): Promise<{
  noteId: string | null
  cardIds: string[]
  error: any
}> {
  try {
    // Get note type to determine templates
    const { data: noteType, error: noteTypeError } = await getNoteTypeBySlug(noteTypeSlug)
    
    if (noteTypeError || !noteType) {
      return { noteId: null, cardIds: [], error: noteTypeError || 'Note type not found' }
    }

    // Create the note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        note_type_id: noteType.id,
        word_id: wordId || null,
        fields: fields,
        tags: tags
      })
      .select()
      .single()

    if (noteError || !note) {
      return { noteId: null, cardIds: [], error: noteError }
    }

    // Get card templates for this note type
    const { data: templates, error: templatesError } = await supabase
      .from('card_templates')
      .select('*')
      .eq('note_type_id', noteType.id)
      .order('ordinal')

    if (templatesError || !templates || templates.length === 0) {
      return { noteId: note.id, cardIds: [], error: templatesError || 'No templates found' }
    }

    // Generate cards based on note type
    const cardsToCreate = await generateCardsFromNote(note, noteType, templates, fields)

    // Insert cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .insert(cardsToCreate)
      .select()

    if (cardsError || !cards) {
      return { noteId: note.id, cardIds: [], error: cardsError }
    }

    return {
      noteId: note.id,
      cardIds: cards.map(c => c.id),
      error: null
    }
  } catch (error) {
    return { noteId: null, cardIds: [], error }
  }
}

/**
 * Generate card data from a note
 */
async function generateCardsFromNote(
  note: any,
  noteType: NoteType,
  templates: any[],
  fields: Record<string, any>
): Promise<any[]> {
  const cards: any[] = []

  // For cloze cards, generate one card per cloze deletion
  if (noteType.supports_cloze && fields.text) {
    const clozeCards = parseClozeText(fields.text)
    
    for (let i = 0; i < clozeCards.length; i++) {
      const cloze = clozeCards[i]
      const template = templates[0] // Cloze only has one template
      
      cards.push({
        note_id: note.id,
        template_id: template.id,
        template_slug: template.slug,
        position: i,
        render_payload: {
          cloze_number: cloze.number,
          text_with_blank: cloze.textWithBlank,
          answer: cloze.answer,
          full_text: fields.text,
          extra: fields.extra || ''
        }
      })
    }
  } else {
    // For non-cloze cards, create one card per template
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      
      cards.push({
        note_id: note.id,
        template_id: template.id,
        template_slug: template.slug,
        position: i,
        render_payload: {
          ...fields,
          template_type: template.slug
        }
      })
    }
  }

  return cards
}

/**
 * Parse cloze deletions from text
 * Supports format: {{c1::answer}}
 */
function parseClozeText(text: string): Array<{
  number: number
  answer: string
  textWithBlank: string
}> {
  const clozeRegex = /\{\{c(\d+)::([^}]+)\}\}/g
  const clozes: Array<{ number: number; answer: string; textWithBlank: string }> = []
  const matches = [...text.matchAll(clozeRegex)]

  // Group by cloze number
  const clozeMap = new Map<number, string[]>()
  
  matches.forEach(match => {
    const number = parseInt(match[1])
    const answer = match[2]
    
    if (!clozeMap.has(number)) {
      clozeMap.set(number, [])
    }
    clozeMap.get(number)!.push(answer)
  })

  // Generate cards for each unique cloze number
  clozeMap.forEach((answers, number) => {
    const textWithBlank = text.replace(
      new RegExp(`\\{\\{c${number}::([^}]+)\\}\\}`, 'g'),
      '[...]'
    ).replace(
      /\{\{c\d+::([^}]+)\}\}/g,
      '$1' // Show other clozes as plain text
    )

    clozes.push({
      number,
      answer: answers.join(', '),
      textWithBlank
    })
  })

  return clozes.sort((a, b) => a.number - b.number)
}

/**
 * Update a card's render payload
 */
export async function updateCardRenderPayload(
  cardId: string,
  renderPayload: Record<string, any>
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('cards')
      .update({ render_payload: renderPayload })
      .eq('id', cardId)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Delete a note and all its cards
 */
export async function deleteNote(noteId: string): Promise<{ error: any }> {
  try {
    // Cards will be deleted automatically via CASCADE
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    return { error }
  } catch (error) {
    return { error }
  }
}
