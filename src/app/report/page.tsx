"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/auth-context";
import exifr from "exifr";
import {
  UploadCloud,
  FileImage,
  MapPin,
  HelpCircle,
  Activity,
  AlertTriangle,
  Brain,
  FileCheck,
} from "lucide-react";

interface ReportFormData {
  description: string;
  latitude: number;
  longitude: number;
}

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "fetching" | "success" | "error">("idle");
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadedFromPhoto, setLoadedFromPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>({
    defaultValues: {
      description: "",
      latitude: 0,
      longitude: 0,
    },
  });

  const watchLat = watch("latitude");
  const watchLng = watch("longitude");

  // Redirect to Auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Fetch GPS Coordinates automatically on mount
  useEffect(() => {
    if (user) {
      fetchCoordinates();
    }
  }, [user]);

  const fetchCoordinates = () => {
    setGpsStatus("fetching");
    setGpsErrorMsg("");
    setLoadedFromPhoto(false);
    
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude);
        setValue("longitude", position.coords.longitude);
        setGpsStatus("success");
      },
      (error) => {
        console.error("GPS fetch error:", error);
        setGpsStatus("error");
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsErrorMsg("Permission denied. Enable location services in settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsErrorMsg("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setGpsErrorMsg("Request timed out. Try again.");
            break;
          default:
            setGpsErrorMsg("An unknown error occurred while fetching GPS.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Auto-extract GPS data from photo EXIF
      exifr.gps(file)
        .then((gps) => {
          if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
            setValue("latitude", gps.latitude);
            setValue("longitude", gps.longitude);
            setGpsStatus("success");
            setLoadedFromPhoto(true);
          }
        })
        .catch((err) => {
          console.warn("No GPS metadata extracted from photo:", err);
        });
      
      // Auto-compress image to speed up uploads and stay under Firestore document size limits
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                setImageFile(compressedFile);
                setImagePreview(URL.createObjectURL(compressedFile));
              } else {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }
            },
            "image/jpeg",
            0.75
          );
        };
      };
    }
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!imageFile) {
      setApiError("Please upload an image of the infrastructure issue.");
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      // Step 1: Upload and Geocoding
      setSubmitStep("Analyzing location and connecting to database...");
      
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("description", data.description);
      formData.append("latitude", data.latitude.toString());
      formData.append("longitude", data.longitude.toString());
      formData.append("createdBy", user?.uid || "anonymous");

      // Step 2: Call server API which triggers Gemini Vision and Complaint drafts
      setSubmitStep("Connecting to Google AI Studio for image triage...");
      
      const res = await fetch("/api/report", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to submit report.");
      }

      setSubmitStep("Filing complaint and caching insights...");
      // Success! Route to Detail Page
      router.push(`/report/${result.reportId}`);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "An unexpected error occurred during submission.");
      setSubmitting(false);
      setSubmitStep("");
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950">File Hyperlocal Report</h1>
          <p className="mt-1 text-sm text-slate-500">
            Submit a photo and description of local infrastructure damage. Gemini AI will evaluate severity and route the report.
          </p>
        </div>

        {apiError && (
          <div className="mb-6 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-800 rounded p-4 text-sm shadow-sm">
            <AlertTriangle className="h-5 w-5 text-red-800 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Submission Error</span>
              <p className="mt-1">{apiError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Content - Left */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
            {/* Image Upload Area */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <label className="block text-sm font-bold text-slate-900 mb-2">Upload Proof Image *</label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center text-center hover:border-slate-400 transition-colors bg-slate-50 cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Click to upload photo</p>
                  <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, JPEG (Max 10MB)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative border border-slate-200 rounded-lg overflow-hidden max-h-[300px]">
                    <img src={imagePreview} alt="Issue preview" className="w-full h-auto object-contain max-h-[300px]" />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-2.5">
                    <div className="flex items-center space-x-2">
                      <FileImage className="h-4.5 w-4.5 text-slate-500" />
                      <span className="text-xs text-slate-600 truncate max-w-[200px]">{imageFile?.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setLoadedFromPhoto(false);
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Description Area */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <label htmlFor="description" className="block text-sm font-bold text-slate-900 mb-2">
                Issue Description *
              </label>
              <textarea
                id="description"
                rows={4}
                {...register("description", {
                  required: "Please provide a description of the issue to assist classification.",
                  minLength: { value: 10, message: "Description should be at least 10 characters." },
                })}
                placeholder="Describe the issue, its visual hazards, and approximate landmarks (e.g. 'Large pothole on center lane of Sector 3 road, about 10 meters past the traffic signal.')"
                className="w-full border border-slate-200 rounded-md p-3 text-sm focus:border-slate-400 focus:outline-none placeholder-slate-400 bg-white"
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.description.message}</p>
              )}
            </div>

            {/* Geolocation Fields */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-slate-600" />
                  <label className="block text-sm font-bold text-slate-900">Precise Geolocation *</label>
                </div>
                <button
                  type="button"
                  onClick={fetchCoordinates}
                  className="text-xs font-semibold text-slate-700 border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                >
                  Detect Again
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    {...register("latitude", { required: true, min: -90, max: 90, valueAsNumber: true })}
                    className="w-full border border-slate-200 rounded bg-white p-2.5 text-sm text-slate-900 mt-1 focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    {...register("longitude", { required: true, min: -180, max: 180, valueAsNumber: true })}
                    className="w-full border border-slate-200 rounded bg-white p-2.5 text-sm text-slate-900 mt-1 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Editable Coords Helper Tip */}
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                Tip: Coordinates are auto-detected from your device GPS. If you are uploading a photo taken at a different location, you can manually type in the correct coordinates.
              </p>

              {/* Status Message */}
              <div className="mt-4 flex items-center space-x-2 text-xs">
                {gpsStatus === "fetching" && (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-800"></div>
                    <span className="text-slate-500 font-medium">Acquiring satellite locks...</span>
                  </>
                )}
                {gpsStatus === "success" && (
                  <span className="text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">
                    {loadedFromPhoto 
                      ? "GPS Geotag loaded from Photo metadata" 
                      : "GPS Coordinates Locked successfully"}
                  </span>
                )}
                {gpsStatus === "error" && (
                  <span className="text-red-700 font-medium bg-red-50 border border-red-100 rounded px-2 py-0.5">
                    GPS Error: {gpsErrorMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={submitting || gpsStatus === "fetching"}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-md transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
              >
                File Civic Report
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Workflow Guide - Right */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white shadow-sm">
              <h2 className="text-base font-bold mb-4 flex items-center space-x-2 text-white">
                <HelpCircle className="h-5 w-5 text-slate-300" />
                <span>How Processing Works</span>
              </h2>
              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex space-x-3">
                  <div className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 mt-0.5 flex-shrink-0">
                    1
                  </div>
                  <p>Our server securely wraps your image and text description.</p>
                </div>
                <div className="flex space-x-3">
                  <div className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 mt-0.5 flex-shrink-0">
                    2
                  </div>
                  <p>Gemini Vision inspects the photo content to determine its category and risk level.</p>
                </div>
                <div className="flex space-x-3">
                  <div className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 mt-0.5 flex-shrink-0">
                    3
                  </div>
                  <p>A formal complaint letter is drafted and mapping coordinates are reverse-geocoded.</p>
                </div>
                <div className="flex space-x-3">
                  <div className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 mt-0.5 flex-shrink-0">
                    4
                  </div>
                  <p>The report logs immediately onto the live map for municipal monitoring.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 text-slate-700 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                <Activity className="h-4.5 w-4.5 text-slate-600" />
                <span>Validation Criteria</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reports must contain clear photos of local damage. Avoid blurry images, unrelated files, or screenshots. Files will be parsed and filtered by the AI Classifier before filing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submitting Overlay Portal */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-8 shadow-2xl flex flex-col items-center text-center">
            {/* Spinning Indicator */}
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-slate-900 animate-spin"></div>
              <Brain className="h-6 w-6 text-slate-900 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>

            <h3 className="text-lg font-bold text-slate-950 mb-2">Analyzing Civic Report</h3>
            <p className="text-sm text-slate-500 max-w-xs">{submitStep}</p>

            <div className="mt-6 border-t border-slate-100 pt-4 w-full flex items-center justify-center space-x-1.5 text-xs text-slate-400">
              <FileCheck className="h-4 w-4" />
              <span>Generating municipality-ready letter...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
