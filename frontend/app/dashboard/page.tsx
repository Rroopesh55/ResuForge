"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, Sparkles, Download, Save, Loader2, AlertCircle, Eye, Code } from "lucide-react"
import dynamic from 'next/dynamic'
import { isDOCX, isPDF } from '@/lib/pdf-utils'

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/pdf-viewer/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )
})

export default function Dashboard() {
  const searchParams = useSearchParams()
  const [jdText, setJdText] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [keywords, setKeywords] = useState<string[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('text')
  const [isConvertingPDF, setIsConvertingPDF] = useState(false)
  
  useEffect(() => {
    const jdParam = searchParams.get("jd")
    if (jdParam) {
      setJdText(jdParam)
    }
  }, [searchParams])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    
    const file = e.target.files[0]
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      // Parse for text extraction
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      setResumeText(data.text)
      
      // Handle PDF rendering
      if (isPDF(file)) {
        // If already PDF, use directly
        setPdfFile(file)
        setViewMode('pdf')
      } else if (isDOCX(file)) {
        // Convert DOCX to PDF for rendering
        await convertToPDF(file)
      }
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setIsUploading(false)
    }
  }

  const convertToPDF = async (file: File) => {
    setIsConvertingPDF(true)
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const res = await fetch("http://localhost:8000/convert-to-pdf", {
        method: "POST",
        body: formData
      })
      
      if (!res.ok) throw new Error("PDF conversion failed")
      
      const pdfBlob = await res.blob()
      const pdfFile = new File([pdfBlob], file.name.replace(/\.[^/.]+$/, ".pdf"), {
        type: 'application/pdf'
      })
      
      setPdfFile(pdfFile)
      setViewMode('pdf')
    } catch (err) {
      console.error("PDF conversion failed", err)
      // Fallback to text mode if conversion fails
      setViewMode('text')
    } finally {
      setIsConvertingPDF(false)
    }
  }

  const handleAnalyzeJD = async () => {
    if (!jdText.trim()) return
    
    setIsAnalyzing(true)
    try {
      const res = await fetch("http://localhost:8000/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: jdText })
      })
      const data = await res.json()
      setKeywords(data.keywords || [])
    } catch (err) {
      console.error("Analysis failed", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Sidebar / Navigation */}
      <aside className="w-20 flex flex-col items-center py-6 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl mb-8 shadow-lg">
          <FileText className="text-white h-6 w-6" />
        </div>
        <nav className="flex flex-col gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200"
          >
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Save className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Resume Preview (Editable) */}
        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resume Preview</h2>
              
              {/* View Mode Toggle */}
              {resumeText && pdfFile && (
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Button
                    variant={viewMode === 'pdf' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setViewMode('pdf')}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    PDF View
                  </Button>
                  <Button
                    variant={viewMode === 'text' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setViewMode('text')}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Text View
                  </Button>
                </div>
              )}
              
              {isConvertingPDF && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Converting to PDF...</span>
                </div>
              )}
            </div>
           
            <div className="flex gap-3">
               <div className="relative">
                 <input 
                   type="file" 
                   className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                   onChange={handleFileUpload}
                   accept=".pdf,.docx,.doc"
                 />
                 <Button 
                   variant="outline" 
                   size="sm"
                   disabled={isUploading}
                   className="relative hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                 >
                   {isUploading ? (
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   ) : (
                     <Upload className="h-4 w-4 mr-2" />
                   )}
                   {isUploading ? "Uploading..." : "Upload"}
                 </Button>
               </div>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={!resumeText}
              >
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </header>
          
          {/* Resume Content - PDF or Text Mode */}
          {viewMode === 'pdf' && pdfFile ? (
            <PDFViewer file={pdfFile} />
          ) : (
            <ScrollArea className="flex-1 p-8">
              {resumeText ? (
                <div className="max-w-[210mm] mx-auto bg-white dark:bg-gray-900 shadow-2xl min-h-[297mm] p-[20mm] border border-gray-200 dark:border-gray-800 rounded-lg whitespace-pre-wrap font-serif text-gray-900 dark:text-gray-100">
                  {resumeText}
                </div>
              ) : (
                <div className="max-w-[210mm] mx-auto min-h-[297mm] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No resume uploaded</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                        Upload a resume file (PDF or DOCX) to see a preview and start editing
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Right Pane: AI Controls & JD */}
        <div className="w-[420px] flex flex-col bg-gray-50 dark:bg-gray-900">
          <header className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <h2 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              AI Optimization
            </h2>
          </header>
          <div className="flex-1 p-6 overflow-y-auto">
            <Tabs defaultValue="jd" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-200 dark:bg-gray-800 p-1">
                <TabsTrigger 
                  value="jd"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Job Description
                </TabsTrigger>
                <TabsTrigger 
                  value="keywords"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  Keywords ({keywords.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="jd" className="space-y-4 mt-0">
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-900 dark:text-gray-100">Job Description</CardTitle>
                    <CardDescription className="text-sm">
                      Paste the job description to analyze required keywords
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea 
                      placeholder="Paste the full job description here..." 
                      className="min-h-[240px] text-sm resize-none focus-visible:ring-purple-500 dark:bg-gray-950 dark:border-gray-800"
                      value={jdText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJdText(e.target.value)}
                    />
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50" 
                      onClick={handleAnalyzeJD} 
                      disabled={isAnalyzing || !jdText.trim()}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyze & Extract Keywords
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="keywords" className="mt-0">
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-900 dark:text-gray-100">Extracted Keywords</CardTitle>
                    <CardDescription className="text-sm">
                      {keywords.length > 0 
                        ? `Found ${keywords.length} important keyword${keywords.length !== 1 ? 's' : ''}`
                        : "No keywords extracted yet"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {keywords.length > 0 ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((k, i) => (
                              <span 
                                key={i} 
                                className="px-3 py-1.5 bg-white dark:bg-gray-950 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800 text-xs font-medium shadow-sm hover:shadow transition-shadow"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Make sure your resume includes these keywords to improve ATS compatibility
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No keywords yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Analyze a job description to extract keywords
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

