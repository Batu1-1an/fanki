'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  BookOpen, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  Folder,
  Star,
  Users,
  Globe,
  Heart,
  Zap,
  Target,
  Brain
} from 'lucide-react'
import { getUserDesks, createDesk, updateDesk, deleteDesk, Desk } from '@/lib/desks'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const DESK_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
]

const DESK_ICONS = [
  { value: 'book-open', label: 'Book', component: BookOpen },
  { value: 'folder', label: 'Folder', component: Folder },
  { value: 'star', label: 'Star', component: Star },
  { value: 'users', label: 'Users', component: Users },
  { value: 'globe', label: 'Globe', component: Globe },
  { value: 'heart', label: 'Heart', component: Heart },
  { value: 'zap', label: 'Zap', component: Zap },
  { value: 'target', label: 'Target', component: Target },
  { value: 'brain', label: 'Brain', component: Brain },
]

interface DeskManagerProps {
  onDeskSelect?: (desk: Desk | null) => void
  selectedDeskId?: string | null
  className?: string
}

export function DeskManager({ onDeskSelect, selectedDeskId, className }: DeskManagerProps) {
  const [desks, setDesks] = useState<Desk[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDesk, setEditingDesk] = useState<Desk | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'book-open'
  })
  const { success, error: toastError } = useToast()

  const loadDesks = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getUserDesks()
      if (error) {
        toastError({
          title: 'Error',
          description: 'Failed to load desks'
        })
      } else {
        setDesks(data || [])
      }
    } catch (error) {
      console.error('Failed to load desks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    loadDesks()
  }, [loadDesks])

  const handleCreateDesk = async () => {
    try {
      const { data, error } = await createDesk(formData)
      if (error) {
        toastError({
          title: 'Error',
          description: error.message || 'Failed to create desk'
        })
      } else {
        success({
          title: 'Success',
          description: 'Desk created successfully'
        })
        setIsCreateDialogOpen(false)
        setFormData({ name: '', description: '', color: '#3B82F6', icon: 'book-open' })
        loadDesks()
      }
    } catch (error) {
      console.error('Failed to create desk:', error)
    }
  }

  const handleUpdateDesk = async () => {
    if (!editingDesk) return

    try {
      const { data, error } = await updateDesk(editingDesk.id, formData)
      if (error) {
        toastError({
          title: 'Error',
          description: error.message || 'Failed to update desk'
        })
      } else {
        success({
          title: 'Success',
          description: 'Desk updated successfully'
        })
        setIsEditDialogOpen(false)
        setEditingDesk(null)
        setFormData({ name: '', description: '', color: '#3B82F6', icon: 'book-open' })
        loadDesks()
      }
    } catch (error) {
      console.error('Failed to update desk:', error)
    }
  }

  const handleDeleteDesk = async (desk: Desk) => {
    if (desk.is_default) {
      toastError({
        title: 'Error',
        description: 'Cannot delete the default desk'
      })
      return
    }

    try {
      const { error } = await deleteDesk(desk.id)
      if (error) {
        toastError({
          title: 'Error',
          description: error.message || 'Failed to delete desk'
        })
      } else {
        success({
          title: 'Success',
          description: 'Desk deleted successfully'
        })
        if (selectedDeskId === desk.id) {
          onDeskSelect?.(null)
        }
        loadDesks()
      }
    } catch (error) {
      console.error('Failed to delete desk:', error)
    }
  }

  const openEditDialog = (desk: Desk) => {
    setEditingDesk(desk)
    setFormData({
      name: desk.name,
      description: desk.description || '',
      color: desk.color,
      icon: desk.icon
    })
    setIsEditDialogOpen(true)
  }

  const getIconComponent = (iconName: string) => {
    const iconData = DESK_ICONS.find(icon => icon.value === iconName)
    return iconData?.component || BookOpen
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">My Desks</h3>
          <div className="h-9 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">My Desks</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Desk
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Desk</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter desk name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter desk description (optional)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2 mt-2">
                  {DESK_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full border-2",
                        formData.color === color ? "border-gray-400" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Icon</label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {DESK_ICONS.map(icon => {
                    const IconComponent = icon.component
                    return (
                      <button
                        key={icon.value}
                        className={cn(
                          "p-2 rounded border-2 flex items-center justify-center",
                          formData.icon === icon.value 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => setFormData({ ...formData, icon: icon.value })}
                      >
                        <IconComponent className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateDesk} disabled={!formData.name.trim()}>
                  Create Desk
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {desks.map(desk => {
          const IconComponent = getIconComponent(desk.icon)
          const isSelected = selectedDeskId === desk.id
          
          return (
            <Card 
              key={desk.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-blue-500 shadow-md"
              )}
              onClick={() => onDeskSelect?.(isSelected ? null : desk)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${desk.color}20`, color: desk.color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{desk.name}</h4>
                        {desk.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      {desk.description && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {desk.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{desk.word_count || 0} words</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        openEditDialog(desk)
                      }}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {!desk.is_default && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDesk(desk)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Desk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter desk name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter desk description (optional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-2">
                {DESK_COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full border-2",
                      formData.color === color ? "border-gray-400" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Icon</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {DESK_ICONS.map(icon => {
                  const IconComponent = icon.component
                  return (
                    <button
                      key={icon.value}
                      className={cn(
                        "p-2 rounded border-2 flex items-center justify-center",
                        formData.icon === icon.value 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setFormData({ ...formData, icon: icon.value })}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateDesk} disabled={!formData.name.trim()}>
                Update Desk
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DeskManager
