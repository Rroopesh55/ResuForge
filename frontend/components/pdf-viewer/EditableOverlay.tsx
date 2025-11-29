"use client"

import { useState } from 'react'
import { Edit2 } from 'lucide-react'

// Types matching PDF.js text content items
export interface TextItem {
  str: string
  dir: string
  transform: number[] // [scaleX, skewY, skewX, scaleY, x, y]
  width: number
  height: number
  fontName: string
  hasEOL: boolean
}

interface EditableOverlayProps {
  items: TextItem[]
  scale: number
  pageHeight: number
  onEdit: (text: string, itemIndex: number) => void
}

export default function EditableOverlay({ items, scale, pageHeight, onEdit }: EditableOverlayProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Filter out empty items or whitespace-only items to reduce noise
  const validItems = items.map((item, index) => ({ item, index })).filter(({ item }) => item.str.trim().length > 0)

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {validItems.map(({ item, index }) => {
        // PDF coordinates: (0,0) is bottom-left
        // HTML coordinates: (0,0) is top-left
        // transform[4] is x, transform[5] is y
        // We need to flip Y axis: y_html = pageHeight - y_pdf - height
        
        const x = item.transform[4] * scale
        // The y coordinate in PDF is usually the baseline. 
        // We need to adjust for the height to get the top-left corner.
        // However, PDF.js text layer logic is complex. 
        // A simplified approach is to use the viewport height.
        // Let's rely on the fact that we are overlaying on a canvas that is already scaled.
        
        // Actually, let's try to match the visual bounding box.
        // item.height is often 0 in the raw data, we might need to use transform[3] (scaleY) as font size/height
        const fontSize = Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]);
        const height = (item.height || fontSize) * scale
        const width = item.width * scale
        
        // PDF Y is from bottom. 
        // viewportY = pageHeight - pdfY
        // But pdfY is baseline. So top is pdfY + height? No, usually pdfY is baseline.
        // Let's assume standard PDF coordinate system where y is distance from bottom.
        // So top_html = page_height_html - (y_pdf * scale) - height_html
        // Wait, let's look at how react-pdf does it. 
        // It uses `viewport.convertToViewportPoint(x, y)`
        
        // Since we don't have the viewport object here easily without passing it down,
        // we'll try a standard conversion and adjust if needed.
        // For now, let's assume:
        // left = x * scale
        // top = pageHeight - (y * scale) - height
        
        const pdfY = item.transform[5]
        const top = pageHeight - (pdfY * scale) - height
        
        return (
          <div
            key={index}
            className={`absolute cursor-pointer pointer-events-auto transition-all duration-200 group ${
              hoveredIndex === index 
                ? "bg-purple-100/50 border border-purple-400 shadow-sm" 
                : "hover:bg-purple-50/30"
            }`}
            style={{
              left: `${x}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item.str, index)
            }}
            title="Click to edit"
          >
            {hoveredIndex === index && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap flex items-center gap-1">
                <Edit2 className="h-3 w-3" />
                Edit
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
