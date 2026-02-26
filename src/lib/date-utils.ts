export type DueClassification = 'overdue' | 'due_today' | 'future'

export function toLocalDateKey(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isSameLocalDay(a: string | Date, b: string | Date): boolean {
  return toLocalDateKey(a) === toLocalDateKey(b)
}

export function classifyDueDate(dueDate: string | Date, now: Date = new Date()): DueClassification {
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate)

  if (isSameLocalDay(due, now)) {
    return 'due_today'
  }

  if (due.getTime() < now.getTime()) {
    return 'overdue'
  }

  return 'future'
}
