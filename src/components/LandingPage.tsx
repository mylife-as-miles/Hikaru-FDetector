/**
 * Modern Landing Page for Hikaru-FDetector
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  Camera, 
  Eye, 
  ArrowRight, 
  Play, 
  Github, 
  Smartphone,
  Brain,
  ScanLine,
  Target,
  ChevronDown
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    // Initial animations
    tl.from(logoRef.current, {
      duration: 1.2,
      y: 100,
      opacity: 0,
      ease: "power3.out"
    })
    .from(titleRef.current, {
      duration: 0.8,
      y: 50,
      opacity: 0,
      ease: "power3.out"
    }, "-=0.8")
    .from(subtitleRef.current, {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: "power3.out"
    }, "-=0.6")
    .from(ctaRef.current, {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: "power3.out"
    }, "-=0.4")
    .from(featuresRef.current, {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: "power3.out"
    }, "-=0.2");
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description: "Advanced face and fruit detection using Google Gemini Vision API with real-time analysis",
      color: "from-blue-500 to-cyan-400"
    },
    {
      icon: ScanLine,
      title: "Real-Time Processing",
      description: "Instant detection and bounding box visualization with confidence scoring",
      color: "from-purple-500 to-indigo-400"
    },
    {
      icon: Target,
      title: "High Precision",
      description: "Machine learning models optimized for accuracy across various lighting conditions",
      color: "from-green-500 to-teal-400"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "PWA-ready with responsive design for seamless mobile and desktop experience",
      color: "from-orange-500 to-red-400"
    }
  ];

  const stats = [
    { value: "99%", label: "Detection Accuracy" },
    { value: "<100ms", label: "Processing Time" },
    { value: "15+", label: "Fruit Types" },
    { value: "PWA", label: "Ready" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-60">
        <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-r from-blue-500/40 to-cyan-400/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 sm:w-[32rem] h-96 sm:h-[32rem] bg-gradient-to-l from-purple-500/30 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-br from-teal-400/25 to-blue-600/18 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/6 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-tr from-cyan-300/20 to-blue-400/12 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between p-4 sm:p-6 backdrop-blur-xl bg-zinc-900/80 border-b border-zinc-800/60">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Hikaru-FDetector
          </span>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <a
            href="https://github.com/mylife-as-miles/Hikaru-FDetector"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 hover:text-white transition-all"
          >
            <Github className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
          <button
            onClick={onGetStarted}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:scale-105 text-sm sm:text-base"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-40 flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[80vh] px-4 sm:px-6 text-center">
        {/* Logo */}
        <div ref={logoRef} className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/60 to-zinc-600/60 rounded-full blur-2xl opacity-60 scale-110"></div>
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 rounded-full flex items-center justify-center shadow-2xl border border-zinc-600/40">
            <Eye className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
          </div>
        </div>

        {/* Title */}
        <h1 ref={titleRef} className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent leading-tight px-2">
          AI Vision
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Detection
          </span>
        </h1>

        {/* Subtitle */}
        <p ref={subtitleRef} className="text-base sm:text-xl md:text-2xl text-zinc-300 max-w-xs sm:max-w-3xl mb-6 sm:mb-8 leading-relaxed px-4">
          Advanced <span className="text-blue-400 font-semibold">face detection</span> and{' '}
          <span className="text-green-400 font-semibold">fruit classification</span> powered by{' '}
          <span className="text-purple-400 font-semibold">Google Gemini Vision</span>
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
          <button
            onClick={onGetStarted}
            className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-2xl text-sm sm:text-base"
          >
            <span className="flex items-center justify-center space-x-2">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity -z-10"></div>
          </button>
          
          <button className="group px-6 sm:px-8 py-3 sm:py-4 bg-zinc-900/60 hover:bg-zinc-800/60 backdrop-blur-xl border border-zinc-700/60 hover:border-zinc-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base">
            <span className="flex items-center justify-center space-x-2">
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Watch Demo</span>
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 max-w-xs sm:max-w-2xl px-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-3 sm:p-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-xl text-center"
            >
              <div className="text-lg sm:text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-zinc-300">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative z-40 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Built with cutting-edge AI technology for real-world applications
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative z-40 py-20 px-6 bg-zinc-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            Powered by Modern Technology
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "React 18", description: "Modern UI framework" },
              { name: "TypeScript", description: "Type-safe development" },
              { name: "Gemini Vision", description: "Google AI API" },
              { name: "Tailwind CSS", description: "Utility-first styling" }
            ].map((tech, index) => (
              <div key={index} className="p-6 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl">
                <div className="text-lg font-semibold text-white mb-2">{tech.name}</div>
                <div className="text-sm text-zinc-400">{tech.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-40 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            Ready to Start Detecting?
          </h2>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Experience the power of AI-driven computer vision in your browser. No downloads, no setup required.
          </p>
          
          <button
            onClick={onGetStarted}
            className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl"
          >
            <span className="flex items-center space-x-3">
              <Camera className="w-6 h-6" />
              <span>Launch Hikaru-FDetector</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity -z-10"></div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 py-12 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Hikaru-FDetector</span>
          </div>
          <p className="text-zinc-500 mb-4">
            Advanced AI vision detection for modern applications
          </p>
          <div className="flex items-center justify-center space-x-6">
            <a href="#" className="text-zinc-500 hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors">
              Terms
            </a>
            <a 
              href="https://github.com/mylife-as-miles/Hikaru-FDetector" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
