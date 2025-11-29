"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Sparkles, Loader2 } from "lucide-react"

interface TextEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newText: string) => void
  originalText: string
  maxChars?: number
  onOptimize?: (text: string) => Promise<string>
}

export default function TextEditDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  originalText, 
  maxChars,
  onOptimize 
}: TextEditDialogProps) {
  const [text, setText] = useState(originalText)
  const [isOptimizing, setIsOptimizing] = useState(false)
  
  // Reset text when dialog opens with new originalText
  useEffect(() => {
    setText(originalText)
  }, [originalText, isOpen])

  const charCount = text.length
  const limit = maxChars || Math.max(originalText.length + 50, 200) // Default limit logic
  const isOverLimit = charCount > limit
  const isChanged = text !== originalText

  const handleSave = () => {
    if (!isOverLimit) {
      onSave(text)
      onClose()
    }
  }

  const handleOptimize = async () => {
    if (!onOptimize) return
    
    setIsOptimizing(true)
    try {
      const optimized = await onOptimize(text)
      setText(optimized)
    } catch (error) {
      console.error("Optimization failed:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
          <DialogDescription>
            Make changes to your resume content. Keep an eye on the character limit to ensure it fits the layout.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`min-h-[150px] font-mono text-sm ${
              isOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            placeholder="Enter your text here..."
          />
          
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center gap-2 ${
              isOverLimit ? "text-red-600 font-medium" : "text-gray-500"
            }`}>
              {isOverLimit ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <span>
                {charCount} / {limit} characters
              </span>
            </div>
            
            {onOptimize && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                {isOptimizing ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-2" />
                )}
                AI Rewrite
              </Button>
            )}
          </div>
          
          {isOverLimit && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              Text is too long! Please shorten it by {charCount - limit} characters to prevent layout issues.
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isOverLimit || !isChanged}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
