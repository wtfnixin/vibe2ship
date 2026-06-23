import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateInsights } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch all reports from Firestore
    const reportsSnapshot = await getDocs(collection(db, "reports"));
    const reports: any[] = [];
    reportsSnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });

    // Sort reports by date descending
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 2. Compute statistics
    const totalReports = reports.length;
    const openIssues = reports.filter((r) => r.status !== "Resolved").length;
    const resolvedIssues = reports.filter((r) => r.status === "Resolved").length;
    const inProgressIssues = reports.filter((r) => r.status === "In Progress").length;

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    const categoriesList = [
      "Pothole",
      "Garbage",
      "Water Leakage",
      "Streetlight Damage",
      "Sewage Overflow",
      "Fallen Tree",
      "Road Damage",
      "Other",
    ];
    categoriesList.forEach((c) => (categoryCounts[c] = 0));
    reports.forEach((r) => {
      if (r.category) {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      }
    });

    // Severity distribution
    const severityCounts: Record<string, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    reports.forEach((r) => {
      if (r.severity && severityCounts[r.severity] !== undefined) {
        severityCounts[r.severity] += 1;
      }
    });

    // Calculate Weekly Trend (Group by last 7 days)
    const trendData: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      trendData[dateStr] = 0;
    }

    reports.forEach((r) => {
      const date = new Date(r.createdAt);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (trendData[dateStr] !== undefined) {
        trendData[dateStr] += 1;
      }
    });

    const weeklyTrend = Object.keys(trendData).map((date) => ({
      date,
      reports: trendData[date],
    }));

    // 3. Manage Cached AI Insights (Agent 4)
    let aiInsights = {
      summary: "Gathering community reports and compiling civic statistics...",
      hotspots: ["Determining hotspots..."],
      recommendations: ["Formulating recommendations..."],
    };

    try {
      const analyticsRef = doc(db, "analytics", "overview");
      const docSnap = await getDoc(analyticsRef);
      let needsRefresh = true;

      if (docSnap.exists()) {
        const cachedData = docSnap.data();
        const lastUpdated = cachedData.lastUpdated?.toDate
          ? cachedData.lastUpdated.toDate()
          : cachedData.lastUpdated
          ? new Date(cachedData.lastUpdated)
          : null;

        // Use cache if it was updated in the last 10 minutes
        if (lastUpdated && Date.now() - lastUpdated.getTime() < 10 * 60 * 1000 && cachedData.insights) {
          aiInsights = cachedData.insights;
          needsRefresh = false;
        }
      }

      if (needsRefresh) {
        console.log("Insights cache stale or missing. Calling Gemini Agent 4...");
        // Select samples for LLM
        const sampleReports = reports.slice(0, 10).map((r) => ({
          category: r.category,
          severity: r.severity,
          description: r.description.substring(0, 100),
          address: r.address ? r.address.split(",")[0] : "Hyperlocal area",
        }));

        const freshInsights = await generateInsights({
          totalReports,
          categoryCounts,
          severityCounts,
          recentReports: sampleReports,
        });

        // Write to Firestore cache
        await setDoc(
          analyticsRef,
          {
            totalReports,
            categoryCounts,
            severityCounts,
            insights: freshInsights,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
        
        aiInsights = freshInsights;
      }
    } catch (insightsError) {
      console.error("Error retrieving AI insights, returning fallbacks:", insightsError);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalReports,
        openIssues,
        inProgressIssues,
        resolvedIssues,
      },
      categoryData: Object.keys(categoryCounts).map((key) => ({
        name: key,
        value: categoryCounts[key],
      })),
      severityData: Object.keys(severityCounts).map((key) => ({
        name: key,
        value: severityCounts[key],
      })),
      weeklyTrend,
      recentActivity: reports.slice(0, 5),
      aiInsights,
    });
  } catch (error: any) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compile civic analytics data." },
      { status: 500 }
    );
  }
}
