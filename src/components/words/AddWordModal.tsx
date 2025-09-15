'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AddWordForm from './AddWordForm'
import { Word } from '@/types'

interface AddWordModalProps {
  isOpen: boolean
  onClose: () => void
  onWordAdded: (word: Word) => void
}

export default function AddWordModal({ isOpen, onClose, onWordAdded }: AddWordModalProps) {
  const handleWordAdded = (word: Word) => {
    onWordAdded(word)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Word</DialogTitle>
        </DialogHeader>
        <AddWordForm
          onWordAdded={handleWordAdded}
          onCancel={onClose}
          isModal={true}
        />
      </DialogContent>
    </Dialog>
  )
}
