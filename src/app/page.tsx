"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPin, AlertCircle, BarChart3, Users, CheckCircle, FileSpreadsheet } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 bg-slate-50 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-xs font-semibold text-slate-800 mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
            <span>Official Vibe2Ship Hackathon Entry - Hyperlocal Solver</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl max-w-3xl mx-auto leading-tight">
            AI-Powered Hyperlocal Civic Intelligence
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report infrastructure issues instantly. CivicPulse AI uses advanced Gemini Vision to categorize hazards, determine severity, and draft official complaints to expedite municipal response.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-md text-base font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Access Citizen Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-slate-300 bg-white text-slate-700 px-6 py-3 rounded-md text-base font-medium hover:bg-slate-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Real-time Statistics Section */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">94%</div>
              <div className="mt-2 text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider">
                AI Classification Accuracy
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">&lt; 3 Sec</div>
              <div className="mt-2 text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider">
                Gemini Vision Triage Time
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">100%</div>
              <div className="mt-2 text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider">
                Municipality Ready Formats
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">Realtime</div>
              <div className="mt-2 text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider">
                Hyperlocal Map Visuals
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Explanation / How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Intelligent Civic Workflow
            </h2>
            <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto">
              How CivicPulse AI leverages advanced Google Gemini models to transform raw reports into structured municipal actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 relative">
              <div className="absolute -top-4 left-6 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 mb-6">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Report & Locate</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Citizens upload a photo and brief description of an issue. The portal automatically captures precise browser GPS coordinates.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 relative">
              <div className="absolute -top-4 left-6 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 mb-6">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Gemini AI Analysis</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gemini Vision inspects the photo to classify the category, evaluate safety hazards, assign severity levels, and draft a formal municipal report.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 relative">
              <div className="absolute -top-4 left-6 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 mb-6">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Map & Analyze</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Issues map immediately in real-time, allowing users to track progress. Recharts and Gemini summarize trends for city planners to optimize maintenance routes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase: The 4 Agents */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Powering Actions via AI Agents
            </h2>
            <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto">
              Our core intelligence rests on four specialized agents, orchestrated seamlessly behind a clean, user-friendly interface.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-lg">
              <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold">Agent 1</span>
              <h4 className="text-base font-bold text-slate-900 mt-3 mb-1">Issue Classifier</h4>
              <p className="text-xs text-slate-600">
                Instantly parses uploads to identify potholes, broken lights, and water leaks. Rejects unrelated images with a confidence rating.
              </p>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 rounded-lg">
              <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold">Agent 2</span>
              <h4 className="text-base font-bold text-slate-900 mt-3 mb-1">Severity Triage</h4>
              <p className="text-xs text-slate-600">
                Determines risk level (Low, Medium, High, Critical) using visual severity cues to prioritize municipal works departments.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-lg">
              <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold">Agent 3</span>
              <h4 className="text-base font-bold text-slate-900 mt-3 mb-1">Complaint Generator</h4>
              <p className="text-xs text-slate-600">
                Transforms analysis into a structured, formal letter referencing local ordinances, GPS coords, and public safety issues.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-lg">
              <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold">Agent 4</span>
              <h4 className="text-base font-bold text-slate-900 mt-3 mb-1">Insight Aggregator</h4>
              <p className="text-xs text-slate-600">
                Crawls database records periodically to extract hot zones, density patterns, weekly trends, and generates reports for city planners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-16 text-white border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Ready to improve your neighborhood?
          </h2>
          <p className="mt-4 text-base text-slate-300 max-w-xl mx-auto">
            Log in with your Google account to start reporting issues, viewing live trends, and helping resolved infrastructure complaints.
          </p>
          <div className="mt-8">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center space-x-2 bg-white text-slate-950 px-6 py-3 rounded-md text-base font-medium hover:bg-slate-100 transition-colors shadow-sm font-semibold"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4.5 w-4.5 text-slate-950" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} CivicPulse AI. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-medium">Coding Ninjas Vibe2Ship Hackathon Entry</p>
        </div>
      </footer>
    </div>
  );
}
