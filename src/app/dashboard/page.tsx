"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { formatDate } from "@/lib/utils";
import {
  PlusCircle,
  MapPin,
  AlertTriangle,
  FolderDot,
  FileCheck2,
  BrainCircuit,
  TrendingUp,
  Map,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalReports: 0,
    openIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [insights, setInsights] = useState({
    summary: "",
    hotspots: [] as string[],
    recommendations: [] as string[],
  });
  const [fetching, setFetching] = useState(true);

  // Authenticate user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Fetch analytics data
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const res = await fetch("/api/analytics");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
          setInsights(data.aiInsights);
        }
      } catch (error) {
        console.error("Failed to load dashboard statistics:", error);
      } finally {
        setFetching(false);
      }
    }

    loadData();
  }, [user]);

  if (authLoading || (!user && fetching)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Helper colors for Severity
  const getSeverityStyle = (severity: string) => {
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

  // Helper colors for Status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "In Progress":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Resolved":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950">Civic Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back, {user?.displayName}. Here is the current hyperlocal summary of reported issues.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/map"
              className="inline-flex items-center justify-center space-x-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md text-sm transition-colors shadow-sm"
            >
              <Map className="h-4 w-4" />
              <span>Interactive Map</span>
            </Link>
            <Link
              href="/report"
              className="inline-flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Report Issue</span>
            </Link>
          </div>
        </div>

        {fetching ? (
          // Skeletons
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-48 bg-white border border-slate-200 rounded-lg animate-pulse" />
            <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Counts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reports</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalReports}</div>
                </div>
                <div className="h-10 w-10 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                  <FolderDot className="h-5 w-5" />
                </div>
              </div>
              
              {/* Card 2 */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Complaints</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{stats.openIssues}</div>
                </div>
                <div className="h-10 w-10 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{stats.inProgressIssues}</div>
                </div>
                <div className="h-10 w-10 rounded bg-yellow-50 border border-yellow-100 flex items-center justify-center text-yellow-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Issues</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{stats.resolvedIssues}</div>
                </div>
                <div className="h-10 w-10 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileCheck2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* AI Insights Card (Agent 4) */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4">
                <div className="bg-slate-100 p-1.5 rounded-md border border-slate-200 text-slate-800">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">AI Civic Insights Desk</h2>
                  <p className="text-xs text-slate-500">Autonomous synthesis of hyperlocal complaints by Gemini 3.5 Flash</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                {/* Column 1: Summary */}
                <div className="lg:col-span-1 border-r border-slate-100 pr-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Macro Analysis Summary</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{insights.summary || "No complaints reported yet. AI insights will update once issues are logged."}</p>
                </div>

                {/* Column 2: Hotspots */}
                <div className="lg:col-span-1 border-r border-slate-100 px-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identified Density & Hotspots</h3>
                  {insights.hotspots && insights.hotspots.length > 0 ? (
                    <ul className="space-y-2">
                      {insights.hotspots.map((hotspot, idx) => (
                        <li key={idx} className="flex items-start text-sm text-slate-600">
                          <MapPin className="h-4.5 w-4.5 text-slate-400 mr-1.5 flex-shrink-0 mt-0.5" />
                          <span>{hotspot}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No hotspots identified yet.</p>
                  )}
                </div>

                {/* Column 3: Recommendations */}
                <div className="lg:col-span-1 pl-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Municipal Recommendations</h3>
                  {insights.recommendations && insights.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {insights.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mr-2 flex-shrink-0 mt-2"></span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No recommendations pending.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Recent Reports</h2>
                  <p className="text-xs text-slate-500">Real-time listing of active community complaints</p>
                </div>
                <Link
                  href="/analytics"
                  className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-950 font-medium"
                >
                  <span>View Trends</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="h-12 w-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                    <FolderDot className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-800">No issues reported yet</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-1">
                    Help improve your community. Report the first infrastructure issue in your area.
                  </p>
                  <Link
                    href="/report"
                    className="mt-4 bg-slate-900 text-white hover:bg-slate-800 text-sm font-medium py-2 px-4 rounded transition-colors shadow-sm"
                  >
                    Create Report
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-3">Photo</th>
                        <th className="px-6 py-3">Issue Detail</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Severity</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Reported On</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {recentActivity.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50">
                          {/* Image */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <img
                              src={report.imageUrl}
                              alt={report.category}
                              className="h-10 w-12 object-cover rounded border border-slate-200"
                            />
                          </td>

                          {/* Address & Description */}
                          <td className="px-6 py-4 max-w-xs">
                            <div className="font-semibold text-slate-900 truncate">
                              {report.address.split(",")[0]}
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">
                              {report.description}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="font-medium text-slate-800">
                              {report.category}
                            </span>
                          </td>

                          {/* Severity */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityStyle(
                                report.severity
                              )}`}
                            >
                              {report.severity}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(
                                report.status
                              )}`}
                            >
                              {report.status}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                            {formatDate(report.createdAt)}
                          </td>

                          {/* Action Button */}
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <Link
                              href={`/report/${report.id}`}
                              className="inline-flex items-center justify-center border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium py-1 px-2.5 rounded text-xs transition-colors"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
