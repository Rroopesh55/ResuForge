"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  Shield, 
  Sparkles,
  Target,
  Zap,
  Lock,
  Upload,
  Download,
  Star,
  Users,
  TrendingUp
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 lg:px-6 h-16 flex items-center border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <Link className="flex items-center justify-center" href="#">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mr-2">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Resume Writer</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-purple-600 transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-purple-600 transition-colors" href="#how-it-works">
            How It Works
          </Link>
          <Link className="text-sm font-medium hover:text-purple-600 transition-colors" href="#testimonials">
            Reviews
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-16 md:py-24 lg:py-32 xl:py-40 overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="container relative px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-4xl">
                <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-900 rounded-full shadow-md border border-purple-200 dark:border-purple-800 mb-4">
                  <Sparkles className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">AI-Powered Resume Optimization</span>
                </div>
                
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Tailor Your Resume.{" "}
                  <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Keep Your Format.
                  </span>
                </h1>
                
                <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 text-lg md:text-xl leading-relaxed">
                  The only AI resume optimizer that respects your layout. Zero formatting issues. 
                  <span className="font-semibold text-gray-900 dark:text-white"> 100% ATS friendly.</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-12 px-8 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base border-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  Watch Demo
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 w-full max-w-2xl">
                <div className="space-y-1">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">10K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Resumes Optimized</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">98%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">4.9★</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">User Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Powerful Features That{" "}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Set You Apart
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                Everything you need to create ATS-optimized resumes without losing your unique formatting
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                    <Shield className="text-white h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Layout Protection</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our "Iron Rules" engine ensures your margins, fonts, and page count never change. Your design stays perfect.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                    <Target className="text-white h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">ATS Optimization</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Intelligently weaves in keywords from job descriptions without keyword stuffing. Pass ATS filters effortlessly.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                    <Lock className="text-white h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">100% Private</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Powered by local LLMs (Ollama). Your sensitive resume data never leaves your machine. Complete privacy.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="text-white h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI-Powered Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Advanced AI extracts keywords, analyzes job descriptions, and provides intelligent optimization suggestions.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                    <Zap className="text-white h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Lightning Fast</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Optimize your resume in seconds, not hours. Upload, analyze, and export your perfect resume instantly.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300 group">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="text-white h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Format Support</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Works with PDF and DOCX formats. Import your existing resume and start optimizing immediately.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                Three simple steps to your perfect, ATS-optimized resume
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="relative text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <div className="absolute top-10 left-[60%] hidden md:block">
                  <ArrowRight className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">1. Upload</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload your existing resume in PDF or DOCX format. Your layout is preserved perfectly.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <div className="absolute top-10 left-[60%] hidden md:block">
                  <ArrowRight className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">2. Optimize</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Paste the job description. Our AI extracts keywords and optimizes your resume content.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
                  <Download className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">3. Download</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Export your optimized resume with the same perfect formatting. Ready to send!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-16 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Loved by{" "}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Job Seekers
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                See what our users are saying about their success stories
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {/* Testimonial 1 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "Finally! A tool that actually keeps my resume formatting intact. Got past the ATS and landed 3 interviews in one week!"
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                      SJ
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Sarah Johnson</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Software Engineer</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 2 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "The privacy aspect is huge for me. No more uploading my resume to random websites. Everything stays local!"
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                      MC
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Michael Chen</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Product Manager</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 3 */}
              <Card className="border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "Saved me hours of manual keyword optimization. The AI is smart enough to make it sound natural, not stuffed."
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                      EP
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Emily Parker</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Marketing Director</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center text-white">
              <div className="space-y-4 max-w-3xl">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  Ready to Land Your Dream Job?
                </h2>
                <p className="text-lg md:text-xl text-white/90">
                  Join thousands of successful job seekers who've optimized their resumes with Resume Writer
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="h-12 px-8 bg-white text-purple-600 hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl">
                    Start Optimizing Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-12 px-8 bg-transparent border-2 border-white text-white hover:bg-white/10 transition-colors">
                  See Examples
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">10,000+ Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm">98% Success Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-white" />
                  <span className="text-sm">4.9/5 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-4 md:px-6 bg-gray-950 text-gray-400">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mr-2">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">Resume Writer</span>
              </div>
              <p className="text-sm">
                AI-powered resume optimization that preserves your formatting.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Product</h4>
              <nav className="flex flex-col space-y-2 text-sm">
                <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                <Link href="/dashboard" className="hover:text-white transition-colors">Get Started</Link>
                <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
              </nav>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Company</h4>
              <nav className="flex flex-col space-y-2 text-sm">
                <Link href="#" className="hover:text-white transition-colors">About Us</Link>
                <Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link>
                <Link href="#" className="hover:text-white transition-colors">Blog</Link>
                <Link href="#" className="hover:text-white transition-colors">Contact</Link>
              </nav>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Legal</h4>
              <nav className="flex flex-col space-y-2 text-sm">
                <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
                <Link href="#" className="hover:text-white transition-colors">GDPR</Link>
              </nav>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs">
              © 2024 Resume Writer. All rights reserved.
            </p>
            <p className="text-xs">
              Made with ❤️ for job seekers everywhere
            </p>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
