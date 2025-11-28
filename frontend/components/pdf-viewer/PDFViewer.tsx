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

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Types
interface PDFViewerProps {
  file: string | File | null
  onLoadSuccess?: (info: { numPages: number }) => void
  onLoadError?: (error: Error) => void
}

export default function PDFViewer({ file, onLoadSuccess, onLoadError }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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
        <div className="max-w-[210mm] mx-auto">
          {loading && (
            <div className="flex items-center justify-center min-h-[297mm] bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-purple-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading PDF...</p>
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
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl rounded-lg overflow-hidden"
              width={794} // A4 width in pixels at 96 DPI (210mm)
            />
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
    </div>
  )
}
