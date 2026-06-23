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
    L: any;
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
  const leafletMapInstance = useRef<any>(null);
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
          const data = doc.data();
          if (data.status !== "Spam") {
            list.push({ id: doc.id, ...data });
          }
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

  // Initialize Map (Google Maps or Leaflet)
  useEffect(() => {
    if (loading || !filteredReports.length) return;

    if (isGoogleMapsConfigured) {
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
    } else {
      // Load Leaflet CDN Assets dynamically
      const loadLeaflet = () => {
        // Add leaflet css
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Add leaflet script
        if (!window.L) {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = initLeafletMap;
          document.head.appendChild(script);
        } else {
          initLeafletMap();
        }
      };

      loadLeaflet();
    }

    return () => {
      // Clean up Google markers
      if (googleMapInstance.current) {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
      }
      // Clean up Leaflet map
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
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

  const initLeafletMap = () => {
    if (!mapRef.current || !window.L) return;

    if (leafletMapInstance.current) {
      leafletMapInstance.current.remove();
      leafletMapInstance.current = null;
    }

    let center: [number, number] = [20.5937, 78.9629];
    if (filteredReports.length > 0) {
      const sumLat = filteredReports.reduce((sum, r) => sum + r.latitude, 0);
      const sumLng = filteredReports.reduce((sum, r) => sum + r.longitude, 0);
      center = [sumLat / filteredReports.length, sumLng / filteredReports.length];
    }

    const map = window.L.map(mapRef.current).setView(center, filteredReports.length > 1 ? 12 : 14);
    leafletMapInstance.current = map;

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    filteredReports.forEach((report) => {
      const markerColor =
        report.severity === "Critical"
          ? "#ef4444"
          : report.severity === "High"
          ? "#f97316"
          : report.severity === "Medium"
          ? "#f59e0b"
          : "#10b981";

      const icon = window.L.divIcon({
        className: "custom-leaflet-pin",
        html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); transform: translate(-3px, -3px);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = window.L.marker([report.latitude, report.longitude], { icon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 150px;">
          <span style="font-size: 9px; font-weight: bold; background: #e2e8f0; padding: 2px 5px; border-radius: 3px; color: #475569;">
            ${report.category}
          </span>
          <h4 style="margin: 5px 0 2px 0; font-size: 13px; font-weight: bold; color: #0f172a;">
            ${report.address.split(",")[0]}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b;">
            Severity: ${report.severity}
          </p>
          <a href="/report/${report.id}" style="font-size: 11px; font-weight: 600; color: #0f172a; text-decoration: underline;">
            View Details
          </a>
        </div>
      `);

      marker.on("click", () => {
        setSelectedReport(report);
      });
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
                  // Focus maps center if active
                  if (googleMapInstance.current) {
                    googleMapInstance.current.setCenter({
                      lat: report.latitude,
                      lng: report.longitude,
                    });
                    googleMapInstance.current.setZoom(15);
                  } else if (leafletMapInstance.current) {
                    leafletMapInstance.current.setView(
                      [report.latitude, report.longitude],
                      15
                    );
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
        {/* Unified Map Element */}
        <div ref={mapRef} className="w-full h-full min-h-[350px] lg:min-h-0 z-0" />

        {/* Floating Info Indicator when Leaflet is active */}
        {!isGoogleMapsConfigured && (
          <div className="absolute top-4 left-4 bg-white/95 border border-slate-200 rounded px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm z-10 flex items-center space-x-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>OSM Leaflet Engine (Keyless)</span>
          </div>
        )}

        {/* Selected Leaflet / Google Maps Report Card (shown overlay) */}
        {selectedReport && (
          <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 bg-white border border-slate-200 rounded-lg p-5 max-w-sm text-slate-900 shadow-2xl z-20 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded font-bold text-slate-700">
                {selectedReport.category}
              </span>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <h3 className="text-sm font-bold mt-3 text-slate-900">
              {selectedReport.address.split(",")[0]}
            </h3>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {selectedReport.description}
            </p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                selectedReport.severity === "Critical"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : selectedReport.severity === "High"
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : selectedReport.severity === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {selectedReport.severity} Severity
              </span>
              <Link
                href={`/report/${selectedReport.id}`}
                className="bg-slate-950 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded text-xs transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
