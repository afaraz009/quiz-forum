"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, Edit, Trash2, Plus, Search } from "lucide-react"
import type { VocabularyEntry } from "@/types/vocabulary"
import { VocabularyEntryDialog } from "@/components/vocabulary-entry-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface VocabularyTableProps {
  entries: VocabularyEntry[]
  onEntriesChange: () => void
}

type SortField = keyof VocabularyEntry
type SortDirection = "asc" | "desc"

export function VocabularyTable({ entries, onEntriesChange }: VocabularyTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("word")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [selectedEntry, setSelectedEntry] = useState<VocabularyEntry | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<VocabularyEntry | null>(null)
  const { toast } = useToast()

  const entriesPerPage = 50

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIndicator = (field: SortField) => {
    if (field !== sortField) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (entry) =>
          entry.word.toLowerCase().includes(query) ||
          entry.meaning.toLowerCase().includes(query) ||
          entry.urduTranslation.includes(query) ||
          entry.usageExample.toLowerCase().includes(query)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue)
        return sortDirection === "asc" ? comparison : -comparison
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [entries, searchQuery, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEntries.length / entriesPerPage)
  const paginatedEntries = filteredAndSortedEntries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  )

  const handleAddEntry = () => {
    setDialogMode("add")
    setSelectedEntry(null)
    setDialogOpen(true)
  }

  const handleEditEntry = (entry: VocabularyEntry) => {
    setDialogMode("edit")
    setSelectedEntry(entry)
    setDialogOpen(true)
  }

  const handleDeleteClick = (entry: VocabularyEntry) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch(`/api/vocabulary/${entryToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Vocabulary entry deleted successfully",
        })
        onEntriesChange()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete vocabulary entry",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddEntry} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Table */}
      {filteredAndSortedEntries.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto">
            📚
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {searchQuery ? "No matching entries found" : "No vocabulary entries yet"}
            </p>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "Add your first vocabulary entry to get started"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("word")}
                  >
                    <div className="flex items-center gap-1">
                      Word {getSortIndicator("word")}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("meaning")}
                  >
                    <div className="flex items-center gap-1">
                      Meaning {getSortIndicator("meaning")}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("urduTranslation")}
                  >
                    <div className="flex items-center gap-1">
                      Urdu {getSortIndicator("urduTranslation")}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("usageExample")}
                  >
                    <div className="flex items-center gap-1">
                      Usage {getSortIndicator("usageExample")}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{entry.word}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{entry.meaning}</div>
                    </TableCell>
                    <TableCell className="text-right" dir="rtl">
                      {entry.urduTranslation}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate">{entry.usageExample}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                {Math.min(currentPage * entriesPerPage, filteredAndSortedEntries.length)} of{" "}
                {filteredAndSortedEntries.length} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <VocabularyEntryDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={onEntriesChange}
        entry={selectedEntry}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vocabulary entry for &quot;{entryToDelete?.word}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
