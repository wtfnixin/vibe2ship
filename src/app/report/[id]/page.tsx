"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  ClipboardCheck,
  ClipboardCopy,
  Download,
  CheckCircle2,
  Hourglass,
  Send,
  Calendar,
  Sparkles,
  FileCheck,
  Eye,
  Users,
} from "lucide-react";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

const getDefaultAgency = (category: string): string => {
  switch (category) {
    case "Pothole":
    case "Road Damage":
      return "Public Works Department";
    case "Garbage":
      return "Sanitation & Waste Management";
    case "Water Leakage":
      return "Water Supply & Sewerage Board";
    case "Streetlight Damage":
      return "Municipal Electrical Division";
    case "Sewage Overflow":
      return "Sanitation & Sewerage Board";
    case "Fallen Tree":
      return "Parks & Forestry Dept";
    default:
      return "General Municipal Administration";
  }
};

export default function ReportDetailsPage({ params }: DetailPageProps) {
  const { id } = React.use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [officialResponse, setOfficialResponse] = useState("");
  const [assignedAgency, setAssignedAgency] = useState("");
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [isAdminView, setIsAdminView] = useState(true);

  // Sync state values with report data once loaded
  useEffect(() => {
    if (report) {
      setOfficialResponse((prev) => prev || report.officialResponse || "");
      setAssignedAgency((prev) => prev || report.assignedAgency || getDefaultAgency(report.category));
    }
  }, [report]);

  // Authenticate user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Subscribe to real-time report updates
  useEffect(() => {
    if (!user || !id) return;

    const docRef = doc(db, "reports", id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() });
        } else {
          setReport(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to report:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, id]);

  const handleCopyComplaint = () => {
    if (!report?.complaintDraft) return;
    navigator.clipboard.writeText(report.complaintDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadComplaint = () => {
    if (!report) return;
    const element = document.createElement("a");
    const file = new Blob([report.complaintDraft], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `complaint_${report.category.toLowerCase()}_${id.substring(0, 6)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const updateStatus = async (newStatus: "Submitted" | "In Progress" | "Resolved" | "Spam") => {
    if (!id || !report) return;
    setUpdatingStatus(true);
    try {
      const docRef = doc(db, "reports", id);
      await updateDoc(docRef, { status: newStatus });
      
      // Update analytics counter sums accordingly if they exist
      const analyticsRef = doc(db, "analytics", "overview");
      const snap = await getDoc(analyticsRef);
      if (snap.exists()) {
        const data = snap.data();
        const oldStatus = report.status;
        
        let newOpen = data.openIssues || 0;
        let newResolved = data.resolvedIssues || 0;
        let newInProgress = data.inProgressIssues || 0;

        // Step 1: Remove from old status count
        if (oldStatus === "Submitted") {
          newOpen = Math.max(0, newOpen - 1);
        } else if (oldStatus === "In Progress") {
          newInProgress = Math.max(0, newInProgress - 1);
        } else if (oldStatus === "Resolved") {
          newResolved = Math.max(0, newResolved - 1);
        }

        // Step 2: Add to new status count
        if (newStatus === "Submitted") {
          newOpen += 1;
        } else if (newStatus === "In Progress") {
          newInProgress += 1;
        } else if (newStatus === "Resolved") {
          newResolved += 1;
        }

        await updateDoc(analyticsRef, {
          openIssues: newOpen,
          resolvedIssues: newResolved,
          inProgressIssues: newInProgress,
          lastUpdated: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveOfficialUpdate = async () => {
    if (!id || !report) return;
    setUpdatingNotes(true);
    try {
      const docRef = doc(db, "reports", id);
      await updateDoc(docRef, {
        officialResponse,
        assignedAgency,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to save official update:", err);
    } finally {
      setUpdatingNotes(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[70vh] p-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Report Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested issue report could not be found or has been deleted.</p>
        <Link href="/dashboard" className="mt-4 text-sm font-semibold text-slate-900 flex items-center space-x-1 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Color mappings
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Critical":
        return "bg-red-50 text-red-700 border-red-200 font-semibold";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Navigation / Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          {/* Demo View Mode Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-350/20 max-w-fit mx-auto sm:mx-0">
            <button
              onClick={() => setIsAdminView(false)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                !isAdminView
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Citizen View
            </button>
            <button
              onClick={() => setIsAdminView(true)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                isAdminView
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Officer Console (Demo)
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-center space-x-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Filed: {formatDate(report.createdAt)}</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadge(report.severity)}`}>
                {report.severity} Severity
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950 mt-2">{report.title}</h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center">
                <MapPin className="h-4 w-4 text-slate-400 mr-1" />
                {report.address}
              </p>
            </div>
            
            {/* Real-time Status Tracker */}
            <div className="flex flex-col items-start md:items-end">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Status</span>
              <div className="mt-1 flex items-center space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                  report.status === "Submitted"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : report.status === "In Progress"
                    ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                    : report.status === "Spam"
                    ? "bg-red-50 text-red-800 border-red-200 font-semibold"
                    : "bg-green-50 text-green-800 border-green-200"
                }`}>
                  {report.status}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Graphics */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between max-w-lg mx-auto relative">
              {/* Connector line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0"></div>
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-900 transition-all duration-500 z-0 ${
                report.status === "In Progress" ? "w-1/2" : report.status === "Resolved" ? "w-full" : "w-0"
              }`}></div>

              {/* Step 1: Submitted */}
              <div className="flex flex-col items-center z-10 text-center">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs border border-slate-900">
                  <Send className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 mt-2">Submitted</span>
              </div>

              {/* Step 2: In Progress */}
              <div className="flex flex-col items-center z-10 text-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                  report.status === "In Progress" || report.status === "Resolved"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-400 border-slate-200"
                }`}>
                  <Hourglass className="h-3.5 w-3.5" />
                </div>
                <span className={`text-xs font-semibold mt-2 ${
                  report.status === "In Progress" || report.status === "Resolved" ? "text-slate-800" : "text-slate-400"
                }`}>In Progress</span>
              </div>

              {/* Step 3: Resolved */}
              <div className="flex flex-col items-center z-10 text-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                  report.status === "Resolved"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-slate-50 text-slate-400 border-slate-200"
                }`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span className={`text-xs font-semibold mt-2 ${
                  report.status === "Resolved" ? "text-emerald-700" : "text-slate-400"
                }`}>Resolved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* AI Analysis and Photo (Left) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Visual Proof Photo */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Visual Evidence</h2>
              <div className="relative border border-slate-200 rounded overflow-hidden max-h-[400px] bg-slate-50 flex justify-center">
                <img
                  src={report.imageUrl}
                  alt={report.category}
                  className="w-full h-auto object-contain max-h-[400px]"
                />
              </div>
              <div className="mt-4 bg-slate-50 rounded border border-slate-200 p-3 text-sm">
                <span className="font-bold text-slate-800 block mb-1">Citizen Statement:</span>
                <p className="text-slate-600 italic">"{report.description || "No description provided."}"</p>
              </div>
            </div>

            {/* AI Agent Report Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                <Sparkles className="h-5 w-5 text-slate-700" />
                <h2 className="text-base font-bold text-slate-950">Gemini Triage Intelligence</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Classified Category</span>
                  <div className="font-bold text-slate-950 mt-1">{report.category}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Triage Confidence</span>
                  <div className="font-bold text-slate-950 mt-1">{(report.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              {/* Risk Level & Urgency Window */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Calculated Risk Level</span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-3xl font-extrabold text-slate-950">{report.riskScore || 0}</span>
                      <span className="text-sm text-slate-500">/ 100</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (report.riskScore || 0) >= 80
                          ? "bg-red-600"
                          : (report.riskScore || 0) >= 50
                          ? "bg-orange-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${report.riskScore || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold font-medium">Recommended Action Window</span>
                    <div className="text-lg font-bold text-slate-950 mt-1">{report.urgencyWindow || "Scheduled Maintenance"}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Triage suggestion based on public safety hazard indicators.
                  </div>
                </div>
              </div>

              {/* Deep Vision Audits */}
              {report.visualAudits && report.visualAudits.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-medium">AI Visual Audits Spotted</span>
                  <div className="flex flex-wrap gap-2">
                    {report.visualAudits.map((audit: string, index: number) => (
                      <span key={index} className="inline-flex items-center text-xs bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-medium">
                        <Eye className="h-3.5 w-3.5 text-slate-500 mr-1.5" />
                        {audit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected Parties */}
              {report.impactedParties && report.impactedParties.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-medium">Threatened Demographics</span>
                  <div className="flex flex-wrap gap-2">
                    {report.impactedParties.map((party: string, index: number) => (
                      <span key={index} className="inline-flex items-center text-xs bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-medium">
                        <Users className="h-3.5 w-3.5 text-slate-500 mr-1.5" />
                        {party}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Evaluation Reasoning</span>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1">{report.reasoning}</p>
                </div>
              </div>
            </div>

            {/* Official Response Timeline Card */}
            {(report.officialResponse || report.assignedAgency) && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <FileCheck className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Official Action & Communications</span>
                </h2>
                
                <div className="relative border-l-2 border-slate-200 pl-4 space-y-4 ml-2">
                  {report.assignedAgency && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 bg-slate-900 h-2 w-2 rounded-full border border-white"></div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Assigned Agency</span>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{report.assignedAgency}</p>
                    </div>
                  )}
                  
                  {report.officialResponse ? (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 bg-emerald-600 h-2 w-2 rounded-full border border-white"></div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Latest Official Response</span>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1 whitespace-pre-wrap">
                        {report.officialResponse}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 bg-amber-500 h-2 w-2 rounded-full border border-white"></div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status Update</span>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">
                        Report state changed to <strong className="text-slate-850">"{report.status}"</strong>. Awaiting official response notes from dispatch.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Hub & Complaint Letter (Right) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Municipal Control Console */}
            {isAdminView && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white shadow-sm">
                <h2 className="text-base font-bold text-white mb-2 flex items-center space-x-1.5">
                  <FileCheck className="h-4.5 w-4.5 text-slate-300" />
                  <span>Municipal Control Console</span>
                </h2>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Administrative simulator to triage, assign, and respond to this incident. Updates are live on citizen portals immediately.
                </p>
                
                <div className="space-y-4">
                  {/* Status Toggle buttons */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Complaint Status</label>
                     <div className="grid grid-cols-4 gap-2">
                      {(["Submitted", "In Progress", "Resolved", "Spam"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(status)}
                          disabled={updatingStatus || report.status === status}
                          className={`text-xs py-1.5 px-1 rounded border font-semibold text-center transition-all ${
                            report.status === status
                              ? status === "Resolved"
                                ? "bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-900/30"
                                : status === "Spam"
                                ? "bg-red-650 bg-red-600 border-red-500 text-white shadow-sm shadow-red-900/30"
                                : "bg-slate-800 border-slate-700 text-white"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950/80"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Agency Selector */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Assign Dept/Agency</label>
                    <select
                      value={assignedAgency}
                      onChange={(e) => setAssignedAgency(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-600"
                    >
                      <option value="Public Works Department">Public Works Department</option>
                      <option value="Sanitation & Waste Management">Sanitation & Waste Management</option>
                      <option value="Water Supply & Sewerage Board">Water Supply & Sewerage Board</option>
                      <option value="Municipal Electrical Division">Municipal Electrical Division</option>
                      <option value="Parks & Forestry Dept">Parks & Forestry Dept</option>
                      <option value="General Municipal Administration">General Municipal Administration</option>
                    </select>
                  </div>

                  {/* Official Update Input */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Official Response Note</label>
                    <textarea
                      value={officialResponse}
                      onChange={(e) => setOfficialResponse(e.target.value)}
                      placeholder="Enter official resolution notes, dispatch times, or updates for citizens..."
                      rows={3}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 resize-none"
                    />
                  </div>

                  {/* Submit Update button */}
                  <button
                    onClick={saveOfficialUpdate}
                    disabled={updatingNotes || (report.officialResponse === officialResponse && report.assignedAgency === assignedAgency)}
                    className="w-full bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold py-2 rounded transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{updatingNotes ? "Saving Update..." : "Publish Official Update"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Complaint Draft Generator (Agent 3) */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="text-sm font-bold text-slate-900">Official Complaint Draft</h3>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleCopyComplaint}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors text-slate-600"
                    title="Copy Draft"
                  >
                    {copied ? <ClipboardCheck className="h-4 w-4 text-emerald-600" /> : <ClipboardCopy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleDownloadComplaint}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-50 transition-colors text-slate-600"
                    title="Download Text File"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {report.complaintDraft ? (
                <div className="border border-slate-100 bg-slate-50 rounded p-3 text-xs font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto text-slate-600 leading-normal">
                  {report.complaintDraft}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No formal draft generated.</p>
              )}

              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                * Draft generated automatically by Gemini Complaint Agent. Ready to be printed, emailed, or filed on official municipality channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
