
"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, Sparkles, Download, Loader2, AlertCircle, Eye, Code, CheckCircle, XCircle, Menu, X } from "lucide-react"
import dynamic from 'next/dynamic'
import { isDOCX, isPDF } from '@/lib/pdf-utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const [resumeParagraphs, setResumeParagraphs] = useState<string[]>([])
  const [optimizedParagraphs, setOptimizedParagraphs] = useState<string[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [style, setStyle] = useState<'safe' | 'bold' | 'creative'>('safe')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [validationResults, setValidationResults] = useState<boolean[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  
  // Session History State
  const [sessionFiles, setSessionFiles] = useState<{file: File, timestamp: Date}[]>([])
  
  // Database State
  const [currentResumeId, setCurrentResumeId] = useState<number | null>(null)

  useEffect(() => {
    const jdParam = searchParams.get("jd")
    if (jdParam) {
      setJdText(jdParam)
    }
  }, [searchParams])

  const buildConstraints = (paragraphs: string[]) => {
    return paragraphs.map((para) => ({
      max_chars: Math.max(para.length + 20, 140),
    }))
  }

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const keywordCoverage = useMemo(() => {
    if (!keywords.length) return []
    const sourceParagraphs = (optimizedParagraphs.length ? optimizedParagraphs : resumeParagraphs).join(" \n")
    const normalizedSource = sourceParagraphs.toLowerCase()

    return keywords.map((keyword) => {
      const normalizedKeyword = keyword.trim()
      if (!normalizedKeyword) {
        return { keyword, count: 0 }
      }
      const pattern = new RegExp(`\\b${escapeRegExp(normalizedKeyword.toLowerCase())}\\b`, "g")
      const matches = normalizedSource.match(pattern)
      return {
        keyword,
        count: matches ? matches.length : 0,
      }
    })
  }, [keywords, optimizedParagraphs, resumeParagraphs])

  const addToHistory = (file: File) => {
    setSessionFiles((prev) => {
      const filtered = prev.filter(
        (entry) => !(entry.file.name === file.name && entry.file.lastModified === file.lastModified)
      )
      const next = [{ file, timestamp: new Date() }, ...filtered]
      return next.slice(0, 10)
    })
  }

  const processUploadedFile = async (file: File, options: { skipHistory?: boolean } = {}) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Failed to parse resume")
      }

      const data = await res.json()

      if (data.resume_id) {
        setCurrentResumeId(data.resume_id)
      }

      const paragraphs: string[] = data.raw_content || data.text?.split("\n") || []
      setResumeParagraphs(paragraphs)
      setOptimizedParagraphs(paragraphs)
      setResumeText(paragraphs.join("\n"))
      setValidationResults([])

      if (!options.skipHistory) {
        addToHistory(file)
      }
      setUploadedFile(file)
      setPdfFile(null)
      setViewMode('text')

      if (isPDF(file)) {
        setPdfFile(file)
        setViewMode('pdf')
      } else if (isDOCX(file)) {
        await convertToPDF(file)
      }
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const file = e.target.files[0]
    await processUploadedFile(file)
    e.target.value = ""
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
      // Add timestamp to filename to avoid caching issues in PDF viewer
      const timestamp = new Date().getTime()
      const pdfFile = new File([pdfBlob], `${file.name.replace(/\.[^/.]+$/, "")}_${timestamp}.pdf`, {
        type: 'application/pdf',
        lastModified: timestamp
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

  const handleOptimizeContent = async () => {
    if (!resumeParagraphs.length || !keywords.length) return
    setIsOptimizing(true)
    try {
      const constraints = buildConstraints(resumeParagraphs)
      const bulletsForRewrite = optimizedParagraphs.length ? optimizedParagraphs : resumeParagraphs
      const res = await fetch("http://localhost:8000/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullets: bulletsForRewrite,
          keywords,
          constraints,
          style,
        }),
      })
      if (!res.ok) throw new Error("Optimization failed")
      const data = await res.json()
      const rewritten = data.rewritten_bullets || optimizedParagraphs
      setOptimizedParagraphs(rewritten)
      setResumeText(rewritten.join("\n"))
      setValidationResults(data.validation || [])
    } catch (err) {
      console.error("Optimization failed", err)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleExport = async (format: "docx" | "pdf") => {
    if (!uploadedFile || !isDOCX(uploadedFile) || !resumeParagraphs.length) return
    setIsExporting(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("bullets_json", JSON.stringify(resumeParagraphs))
      formData.append("constraints_json", JSON.stringify(buildConstraints(resumeParagraphs)))
      const finalBullets = optimizedParagraphs.length ? optimizedParagraphs : resumeParagraphs
      formData.append("keywords_json", JSON.stringify(keywords))
      formData.append("style", style)
      formData.append("output_format", format)
      formData.append("final_bullets_json", JSON.stringify(finalBullets))

      const res = await fetch("http://localhost:8000/optimize-and-export", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Export failed")
      const validationHeader = res.headers.get("x-validation-results")
      if (validationHeader) {
        try {
          const parsed = JSON.parse(validationHeader)
          if (Array.isArray(parsed)) {
            setValidationResults(parsed)
          }
        } catch (err) {
          console.warn("Failed to parse validation header", err)
        }
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = format === "pdf" ? "resume_optimized.pdf" : "resume_optimized.docx"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed", err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleHistoryClick = async (file: File) => {
    await processUploadedFile(file, { skipHistory: true })
    setIsSidebarOpen(false)
  }

  const canOptimize = resumeParagraphs.length > 0 && keywords.length > 0
  const canExport = uploadedFile !== null && isDOCX(uploadedFile) && resumeParagraphs.length > 0
  const validCount = validationResults.filter(Boolean).length
  const invalidIndices = validationResults
    .map((isValid, idx) => (isValid ? null : idx + 1))
    .filter((value): value is number => value !== null)
  const matchedKeywords = keywordCoverage.filter((entry) => entry.count > 0).length

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center">
          <Image
            src="/resuforge-logo.svg"
            alt="ResuForge.ai logo"
            width={140}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>
        <div className="ml-auto lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Session History
        </h3>
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {sessionFiles.map((file, i) => (
              <button
                key={`${file.file.name}-${file.file.lastModified}-${i}`}
                onClick={() => handleHistoryClick(file.file)}
                className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 flex items-start gap-3 ${
                  uploadedFile?.name === file.file.name && uploadedFile?.lastModified === file.file.lastModified
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
                }`}
              >
                <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="truncate font-medium">{file.file.name}</p>
                  <p className="text-xs opacity-70">
                    {file.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </button>
            ))}
            {sessionFiles.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">No files uploaded yet</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-lg lg:hidden">
              {sidebarContent}
            </aside>
          </>
        )}

        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:dark:border-gray-800 lg:bg-white lg:dark:bg-black lg:shadow-sm">
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="flex flex-col gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open session history"
              >
                <Menu className="h-5 w-5" />
              </Button>
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

            <div className="flex items-center gap-3 flex-wrap justify-end">
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
                disabled={!canExport || isExporting}
                onClick={() => setIsExportDialogOpen(true)}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? "Preparing..." : "Export"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/"}
              >
                Home
              </Button>
            </div>
          </header>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Resume Preview (Editable) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 lg:border-b-0 lg:border-r lg:border-gray-200 lg:dark:border-gray-800">
          {/* Resume Content - PDF or Text Mode */}
          {viewMode === 'pdf' && pdfFile ? (
            <PDFViewer 
                file={pdfFile} 
                key={pdfFile.lastModified}
            />
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
        <div className="w-full lg:w-[420px] flex flex-col bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:border-t-0">
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
                        ? `Matched ${matchedKeywords} of ${keywords.length} keywords in the current resume`
                        : "No keywords extracted yet"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {keywords.length > 0 ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-900 dark:text-green-200">
                          {matchedKeywords === keywords.length
                            ? "Every extracted keyword already appears in your resume."
                            : matchedKeywords > 0
                              ? `${matchedKeywords} keyword${matchedKeywords === 1 ? " is" : "s are"} present. Update the missing ones below to improve ATS alignment.`
                              : "No keywords found in the current resume yet. Optimize your bullets or edit manually to include them."}
                        </div>
                        <div className="space-y-2">
                          {keywordCoverage.map(({ keyword, count }, index) => (
                            <div
                              key={`${keyword}-${index}`}
                              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 text-sm">
                                {count > 0 ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                )}
                                <span className="text-gray-900 dark:text-gray-100">{keyword}</span>
                              </div>
                              <span
                                className={`text-xs font-medium ${
                                  count > 0
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {count > 0 ? `${count} match${count > 1 ? "es" : ""}` : "Missing"}
                              </span>
                            </div>
                          ))}
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

            <Card className="border-gray-200 dark:border-gray-800 shadow-sm mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900 dark:text-gray-100">Optimization Controls</CardTitle>
                <CardDescription className="text-sm">
                  Adjust writing style, run optimizations, and export the reconstructed resume.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Writing Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as 'safe' | 'bold' | 'creative')}
                    className="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <option value="safe">Safe · Professional</option>
                    <option value="bold">Bold · Assertive</option>
                    <option value="creative">Creative · Descriptive</option>
                  </select>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  onClick={handleOptimizeContent}
                  disabled={!canOptimize || isOptimizing}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Optimize Bullets
                    </>
                  )}
                </Button>
                {validationResults.length > 0 && (
                  <div
                    className={`text-xs rounded-md border px-3 py-2 ${
                      invalidIndices.length === 0
                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                    }`}
                  >
                    {invalidIndices.length === 0 ? (
                      <span>All {validationResults.length} bullets satisfied the layout constraints.</span>
                    ) : (
                      <span>
                        {validCount}/{validationResults.length} bullets fit the constraints. Bullets{" "}
                        {invalidIndices.join(", ")} reverted to their originals to prevent overflow.
                      </span>
                    )}
                  </div>
                )}
                {!canExport && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Upload a DOCX resume to enable export. PDF uploads can still be optimized but cannot be reconstructed automatically.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </main>
    </div>
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select export format</DialogTitle>
          <DialogDescription>
            Choose how you want to download the optimized resume. You can export either a DOCX for editing
            or a ready-to-share PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={isExporting}
            onClick={() => {
              setIsExportDialogOpen(false)
              handleExport("docx")
            }}
          >
            {isExporting ? "Preparing DOCX..." : "Export as DOCX"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={isExporting}
            onClick={() => {
              setIsExportDialogOpen(false)
              handleExport("pdf")
            }}
          >
            {isExporting ? "Preparing PDF..." : "Export as PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
)
}
