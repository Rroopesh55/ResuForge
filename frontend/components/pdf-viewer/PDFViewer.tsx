/**
 * PDFViewer Component
 * 
 * Renders PDF documents using react-pdf with pixel-perfect accuracy.
 * Supports both direct PDF files and data URLs.
 * 
 * Features:
 * - Automatic scaling to fit container
 * - Page navigation for multi-page documents
/**
 * PDFViewer Component
 * 
 * Renders PDF documents using react-pdf with pixel-perfect accuracy.
 * Supports both direct PDF files and data URLs.
 * 
 * Features:
 * - Automatic scaling to fit container
 * - Page navigation for multi-page documents
 * - Loading states with skeleton
 * - Error handling with retry
 */

"use client"

import { useEffect, useState } from 'react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import EditableOverlay, { TextItem } from './EditableOverlay'
import TextEditDialog from './TextEditDialog'

type PageMetadata = {
  originalWidth: number
  originalHeight: number
}

type TextLayerContent = {
  items: TextItem[]
}

// Types
interface PDFViewerProps {
  file: string | File | null
  onLoadSuccess?: (info: { numPages: number }) => void
  onLoadError?: (error: Error) => void
  onSaveContent?: (originalText: string, newText: string) => Promise<void>
}

export default function PDFViewer({ file, onLoadSuccess, onLoadError, onSaveContent }: PDFViewerProps) {
  const [reactPdf, setReactPdf] = useState<null | typeof import('react-pdf')>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Overlay State
  const [textItems, setTextItems] = useState<TextItem[]>([])
  const [scale, setScale] = useState<number>(1)
  const [pageHeight, setPageHeight] = useState<number>(0)
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingText, setEditingText] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    import('react-pdf')
      .then((module) => {
        if (!mounted) return
        module.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${module.pdfjs.version}/build/pdf.worker.min.mjs`
        setReactPdf(module)
      })
      .catch((err) => {
        console.error('Failed to load react-pdf', err)
        if (mounted) {
          setInitError('Unable to initialize PDF renderer')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  /**
   * Handle successful PDF load
   */
  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    onLoadSuccess?.({ numPages })
  }

  /**
   * Handle PDF load error
   */
  const handleLoadError = (err: Error) => {
    setLoading(false)
    setError(err.message)
    onLoadError?.(err)
    console.error('PDF load error:', err)
  }

  /**
   * Handle Page load success to get dimensions
   */
  const handlePageLoadSuccess = (page: PageMetadata) => {
    // Calculate scale based on rendered width vs original width
    // We force width=794 (A4 at 96 DPI), so scale is 794 / originalWidth
    // But page.width is the *rendered* width if we passed width prop?
    // Actually, page object has originalWidth/originalHeight usually.
    // Let's rely on the fact that we set width={794}.
    
    const renderedWidth = 794
    const currentScale = renderedWidth / page.originalWidth
    setScale(currentScale)
    setPageHeight(page.originalHeight * currentScale)
  }

  /**
   * Capture text items for overlay
   */
  const handleTextLayerSuccess = (textContent: TextLayerContent) => {
    setTextItems(textContent.items)
  }

  /**
   * Handle edit click
   */
  const handleEditClick = (text: string, index: number) => {
    setEditingText(text)
    setEditingIndex(index)
    setIsDialogOpen(true)
  }

  /**
   * Handle save from dialog
   */
  const handleSaveEdit = async (newText: string) => {
    if (editingIndex === null) return
    
    setIsSaving(true)
    try {
        if (onSaveContent) {
            await onSaveContent(editingText, newText)
        }
        
        // Update local state (visual only for now)
        const newItems = [...textItems]
        if (newItems[editingIndex]) {
            newItems[editingIndex] = { ...newItems[editingIndex], str: newText }
            setTextItems(newItems)
        }
    } catch (error) {
        console.error("Failed to save edit:", error)
    } finally {
        setIsSaving(false)
    }
  }

  /**
   * Navigate to previous page
   */
  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1))
  }

  /**
   * Navigate to next page
   */
  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1))
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto opacity-50 text-red-500" />
          <p className="text-sm">{initError}</p>
        </div>
      </div>
    )
  }

  if (!reactPdf) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-purple-600" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading PDF renderer...</p>
        </div>
      </div>
    )
  }

  const { Document, Page } = reactPdf

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
          <p className="text-sm">No PDF file provided</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Failed to load PDF</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
          <Button 
            onClick={() => {
              setError(null)
              setLoading(true)
            }}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Document */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-[210mm] mx-auto relative group/pdf-container">
          {(loading || isSaving) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-purple-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSaving ? "Saving changes..." : "Loading PDF..."}
                </p>
              </div>
            </div>
          )}
          
          <Document
            file={file}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
            loading={null} // We handle loading ourselves
            className="flex justify-center"
          >
            <div className="relative">
                <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-2xl rounded-lg overflow-hidden"
                width={794} // A4 width in pixels at 96 DPI (210mm)
                onLoadSuccess={handlePageLoadSuccess}
                onGetTextSuccess={handleTextLayerSuccess}
                />
                
                {/* Editable Overlay */}
                {!loading && !isSaving && textItems.length > 0 && (
                    <EditableOverlay 
                        items={textItems}
                        scale={scale}
                        pageHeight={pageHeight}
                        onEdit={handleEditClick}
                    />
                )}
            </div>
          </Document>
        </div>
      </div>

      {/* Page Navigation (only show for multi-page documents) */}
      {numPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
          <div className="flex items-center justify-between max-w-[210mm] mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {pageNumber} of {numPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Edit Dialog */}
      <TextEditDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEdit}
        originalText={editingText}
      />
    </div>
  )
}

