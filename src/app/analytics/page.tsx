"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  FolderDot,
  FileCheck,
  TrendingUp,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    openIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [insights, setInsights] = useState({
    summary: "",
    hotspots: [] as string[],
    recommendations: [] as string[],
  });

  // Authenticate user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Fetch analytics stats
  useEffect(() => {
    if (!user) return;

    async function loadStats() {
      try {
        const res = await fetch("/api/analytics");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setCategoryData(data.categoryData);
          setSeverityData(data.severityData);
          setWeeklyTrend(data.weeklyTrend);
          setInsights(data.aiInsights);
        }
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Find most common category
  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
  const topCategory = sortedCategories.length > 0 && sortedCategories[0].value > 0
    ? `${sortedCategories[0].name} (${sortedCategories[0].value})`
    : "None";

  // Calculate resolution rate
  const resolutionRate = stats.totalReports > 0
    ? ((stats.resolvedIssues / stats.totalReports) * 100).toFixed(0) + "%"
    : "0%";

  // Find high-risk counts (High + Critical)
  const highRiskCount = severityData.reduce((sum, item) => {
    if (item.name === "High" || item.name === "Critical") {
      return sum + item.value;
    }
    return sum;
  }, 0);

  // Custom styling elements
  const SEVERITY_COLORS: Record<string, string> = {
    Low: "#10b981",     // Emerald
    Medium: "#f59e0b",  // Amber
    High: "#f97316",    // Orange
    Critical: "#dc2626",// Red
  };

  const chartColors = ["#1e293b", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-slate-700" />
              <span>Civic Intelligence Analytics</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Aggregated reports and statistical trends of public infrastructure issues.
            </p>
          </div>
        </div>

        {/* Highlight KPI Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Top Issue Category</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">{topCategory}</div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Resolution Rate</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">{resolutionRate}</div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">High Risk Reports</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">{highRiskCount}</div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Triage Queue Size</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">{stats.openIssues}</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Trend */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-1.5">
              <TrendingUp className="h-4 w-4 text-slate-600" />
              <span>Civic Reports Weekly Trend</span>
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e293b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1e293b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      color: "#fff",
                      fontSize: "11px",
                      borderRadius: "6px",
                      border: "none",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="#1e293b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReports)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category distribution */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-1.5">
              <FolderDot className="h-4 w-4 text-slate-600" />
              <span>Issues by Category</span>
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={110} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      color: "#fff",
                      fontSize: "11px",
                      borderRadius: "6px",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="value" fill="#475569" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Severity breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col lg:col-span-2">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-1.5">
              <AlertTriangle className="h-4 w-4 text-slate-600" />
              <span>Triage Severity Distribution</span>
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-around h-64">
              <div className="w-full md:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SEVERITY_COLORS[entry.name] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        color: "#fff",
                        fontSize: "11px",
                        borderRadius: "6px",
                        border: "none",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend details */}
              <div className="w-full md:w-1/2 max-w-xs space-y-3 font-medium text-xs">
                {severityData.map((entry, idx) => {
                  const count = entry.value;
                  const percent = stats.totalReports > 0 ? ((count / stats.totalReports) * 100).toFixed(0) : 0;
                  return (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: SEVERITY_COLORS[entry.name] }}
                        />
                        <span className="text-slate-600">{entry.name} Severity</span>
                      </div>
                      <div className="text-slate-900">
                        {count} reports ({percent}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight report card details */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3">AI Aggregated Strategic Summary</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {insights.summary || "No active community reports registered to analyze trends. Dynamic insights will populate once data accumulates."}
          </p>
        </div>
      </div>
    </div>
  );
}
