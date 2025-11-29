/**
 * PDF.js Configuration and Utilities
 * 
 * Sets up PDF.js worker and provides helper functions for PDF rendering.
 * The worker is required for PDF.js to parse PDFs in a background thread.
 */

/**
 * Converts a File object to a data URL for PDF.js
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Validates if a file is a PDF
 */
export const isPDF = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.endsWith('.pdf')
}

/**
 * Validates if a file is a DOCX
 */
export const isDOCX = (file: File): boolean => {
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.doc')
  )
}
