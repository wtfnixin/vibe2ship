"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MapPin,
  Filter,
  AlertTriangle,
  FolderOpen,
  Calendar,
  Layers,
  Search,
} from "lucide-react";

declare global {
  interface Window {
    initMap: () => void;
    google: any;
  }
}

export default function MapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const isGoogleMapsConfigured =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY &&
    !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.startsWith("your_");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Load reports from Firestore
  useEffect(() => {
    if (!user) return;

    // Real-time synchronization of map markers
    const unsubscribe = onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setReports(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading map reports:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let result = reports;

    if (categoryFilter !== "All") {
      result = result.filter((r) => r.category === categoryFilter);
    }

    if (severityFilter !== "All") {
      result = result.filter((r) => r.severity === severityFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.description.toLowerCase().includes(term) ||
          r.address.toLowerCase().includes(term) ||
          r.category.toLowerCase().includes(term)
      );
    }

    setFilteredReports(result);
  }, [reports, categoryFilter, severityFilter, searchTerm]);

  // Initialize Google Map if key exists
  useEffect(() => {
    if (loading || !isGoogleMapsConfigured || !filteredReports.length) return;

    // Load Google script if not already loaded
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initGoogleMap;
      document.head.appendChild(script);
    } else {
      initGoogleMap();
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [loading, filteredReports, isGoogleMapsConfigured]);

  const initGoogleMap = () => {
    if (!mapRef.current || !window.google) return;

    // Determine map center based on reports or default to central India/general coordinate
    let center = { lat: 20.5937, lng: 78.9629 };
    if (filteredReports.length > 0) {
      // Find average lat/lng of matching reports
      const sumLat = filteredReports.reduce((sum, r) => sum + r.latitude, 0);
      const sumLng = filteredReports.reduce((sum, r) => sum + r.longitude, 0);
      center = {
        lat: sumLat / filteredReports.length,
        lng: sumLng / filteredReports.length,
      };
    }

    // Create Map
    googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: filteredReports.length > 1 ? 12 : 14,
      styles: [
        {
          featureType: "administrative.land_parcel",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    // Create info window
    const infoWindow = new window.google.maps.InfoWindow();

    // Add Markers
    filteredReports.forEach((report) => {
      const markerColor =
        report.severity === "Critical"
          ? "#ef4444"
          : report.severity === "High"
          ? "#f97316"
          : report.severity === "Medium"
          ? "#f59e0b"
          : "#10b981";

      // SVG path marker for nice modern pins
      const marker = new window.google.maps.Marker({
        position: { lat: report.latitude, lng: report.longitude },
        map: googleMapInstance.current,
        title: report.category,
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 1.5,
          anchor: new window.google.maps.Point(12, 24),
        },
      });

      marker.addListener("click", () => {
        const contentString = `
          <div style="font-family: sans-serif; padding: 8px; max-width: 200px;">
            <span style="font-size: 10px; font-weight: bold; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; color: #334155;">
              ${report.category}
            </span>
            <h4 style="margin: 6px 0 2px 0; font-size: 14px; font-weight: bold; color: #0f172a;">
              ${report.address.split(",")[0]}
            </h4>
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b;">
              Severity: ${report.severity}
            </p>
            <a href="/report/${report.id}" style="font-size: 12px; font-weight: 600; color: #0f172a; text-decoration: underline;">
              View Details
            </a>
          </div>
        `;
        infoWindow.setContent(contentString);
        infoWindow.open(googleMapInstance.current, marker);
        setSelectedReport(report);
      });

      markersRef.current.push(marker);
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Low":
        return "bg-emerald-500";
      case "Medium":
        return "bg-amber-500";
      case "High":
        return "bg-orange-500";
      case "Critical":
        return "bg-red-600";
      default:
        return "bg-slate-400";
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const categories = [
    "All",
    "Pothole",
    "Garbage",
    "Water Leakage",
    "Streetlight Damage",
    "Sewage Overflow",
    "Fallen Tree",
    "Road Damage",
    "Other",
  ];
  const severities = ["All", "Low", "Medium", "High", "Critical"];

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Sidebar - Filters & List */}
      <div className="w-full lg:w-96 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-950 flex items-center space-x-1.5">
            <Layers className="h-5 w-5 text-slate-700" />
            <span>Interactive Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter hyperlocal reports and inspect localized coordinates.
          </p>

          {/* Search bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by address or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-slate-400 bg-white"
            />
          </div>
        </div>

        {/* Filter Selection Panel */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white mt-1 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white mt-1 focus:outline-none"
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtered Reports List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[300px] lg:max-h-none">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Loading community coordinates...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 italic">
              No matching issues found.
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => {
                  setSelectedReport(report);
                  // Focus google maps center if active
                  if (googleMapInstance.current) {
                    googleMapInstance.current.setCenter({
                      lat: report.latitude,
                      lng: report.longitude,
                    });
                    googleMapInstance.current.setZoom(15);
                  }
                }}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 ${
                  selectedReport?.id === report.id
                    ? "bg-slate-50 border-slate-900"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-700">
                    {report.category}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${getSeverityColor(
                      report.severity
                    )}`}
                    title={`${report.severity} Severity`}
                  ></span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2 truncate">
                  {report.address.split(",")[0]}
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {report.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold">{report.status}</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Map View - Right */}
      <div className="flex-1 relative bg-slate-200 flex flex-col justify-end">
        {isGoogleMapsConfigured ? (
          // Google Map Container
          <div ref={mapRef} className="w-full h-full min-h-[350px] lg:min-h-0" />
        ) : (
          // Vector Fallback Map Grid
          <div className="w-full h-full min-h-[350px] lg:min-h-0 bg-slate-950 flex flex-col relative overflow-hidden select-none">
            {/* Cyberpunk Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.95),rgba(15,23,42,0.95)),linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:100%_100%,40px_40px,40px_40px] opacity-40"></div>

            {/* Coordinates HUD */}
            <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700/50 rounded p-3 text-[10px] font-mono text-slate-400 z-10 space-y-1">
              <div className="text-emerald-500 font-bold uppercase">
                Mock Mapping Overlay Mode
              </div>
              <div>Google Maps Key: Missing/Default</div>
              <div>Grid Center: 20.5937 N, 78.9629 E</div>
              <div>Active Nodes: {filteredReports.length}</div>
            </div>

            {/* Simulated Grid Elements */}
            <div className="flex-1 flex items-center justify-center relative p-8">
              {filteredReports.map((report) => {
                // Map Latitude/Longitude loosely to viewport percentages
                // Formula: map coordinates relative to India boundaries roughly
                // Lat India: 8 to 37. Lng India: 68 to 97.
                const latMin = 8,
                  latMax = 37,
                  lngMin = 68,
                  lngMax = 97;
                
                // Normalizing percentages
                let xPercent =
                  ((report.longitude - lngMin) / (lngMax - lngMin)) * 100;
                let yPercent =
                  100 - ((report.latitude - latMin) / (latMax - latMin)) * 100;

                // Restrict boundaries to viewport 10% to 90%
                xPercent = Math.max(10, Math.min(90, xPercent));
                yPercent = Math.max(10, Math.min(90, yPercent));

                const colorClass =
                  report.severity === "Critical"
                    ? "bg-red-600 ring-red-400"
                    : report.severity === "High"
                    ? "bg-orange-500 ring-orange-300"
                    : report.severity === "Medium"
                    ? "bg-amber-500 ring-amber-300"
                    : "bg-emerald-500 ring-emerald-300";

                const isSelected = selectedReport?.id === report.id;

                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                    className={`absolute p-1 rounded-full border border-white flex items-center justify-center transition-all ${
                      isSelected
                        ? "scale-150 z-30 ring-4"
                        : "hover:scale-125 z-20 ring-2"
                    }`}
                  >
                    <span
                      className={`h-3 w-3 rounded-full flex ${
                        colorClass.split(" ")[0]
                      }`}
                    ></span>
                  </button>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="text-center text-slate-500 font-mono text-sm z-10">
                  NO ACTIVE COORDINATES MATCHING CURRENT FILTER
                </div>
              )}
            </div>

            {/* Selection Popup - fallback map HUD */}
            {selectedReport && (
              <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 bg-slate-900 border border-slate-700/50 rounded-lg p-5 max-w-sm text-white shadow-2xl z-20 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono font-semibold text-slate-300">
                    {selectedReport.category}
                  </span>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-slate-400 hover:text-white font-mono text-xs"
                  >
                    CLOSE
                  </button>
                </div>
                <h3 className="text-sm font-bold mt-3 text-white">
                  {selectedReport.address.split(",")[0]}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {selectedReport.description}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-800 pt-3 text-[10px] font-mono text-slate-500">
                  <div>LAT: {selectedReport.latitude.toFixed(4)}</div>
                  <div>LNG: {selectedReport.longitude.toFixed(4)}</div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">
                    Status: {selectedReport.status}
                  </span>
                  <Link
                    href={`/report/${selectedReport.id}`}
                    className="bg-white hover:bg-slate-100 text-slate-900 font-semibold px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
