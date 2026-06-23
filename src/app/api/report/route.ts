import { NextRequest, NextResponse } from "next/server";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { analyzeAndDraftComplaint } from "@/lib/gemini";

// Helper to reverse geocode lat/lng to an address
async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return `Location near: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
  } catch (error) {
    console.error("Error reverse geocoding:", error);
  }

  return `Location near: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// Helper to update analytics counts in Firestore
async function updateAnalyticsSummary(category: string, severity: string) {
  try {
    const analyticsRef = doc(db, "analytics", "overview");
    const docSnap = await getDoc(analyticsRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const currentCategoryCounts = data.categoryCounts || {};
      const currentSeverityCounts = data.severityCounts || {};
      
      const newCategoryCounts = {
        ...currentCategoryCounts,
        [category]: (currentCategoryCounts[category] || 0) + 1,
      };

      const newSeverityCounts = {
        ...currentSeverityCounts,
        [severity]: (currentSeverityCounts[severity] || 0) + 1,
      };

      await updateDoc(analyticsRef, {
        totalReports: (data.totalReports || 0) + 1,
        categoryCounts: newCategoryCounts,
        severityCounts: newSeverityCounts,
        lastUpdated: serverTimestamp(),
      });
    } else {
      // Initialize analytics document
      await setDoc(analyticsRef, {
        totalReports: 1,
        categoryCounts: { [category]: 1 },
        severityCounts: { [severity]: 1 },
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error updating analytics counters:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const description = formData.get("description") as string;
    const latitudeStr = formData.get("latitude") as string;
    const longitudeStr = formData.get("longitude") as string;
    const createdBy = formData.get("createdBy") as string;

    if (!image) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const latitude = parseFloat(latitudeStr || "0");
    const longitude = parseFloat(longitudeStr || "0");

    // 1. Convert file to buffer for Gemini Vision Analysis
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Perform Geocoding lookup on the server
    const address = await getAddressFromCoords(latitude, longitude);

    // 3. Trigger Agent 1, 2, & 3: Consolidated Gemini Call
    console.log("Performing consolidated Gemini analysis and complaint drafting...");
    const aiResult = await analyzeAndDraftComplaint(
      buffer,
      image.type,
      description,
      address,
      latitude,
      longitude
    );

    // 5. Upload image to Firebase Storage (with instant Base64 fallback if disabled via env or fails)
    let imageUrl = "";
    const disableStorage = process.env.DISABLE_STORAGE === "true";

    if (disableStorage) {
      console.log("Firebase Storage bypass active. Storing image inline as Base64...");
      const base64String = buffer.toString("base64");
      imageUrl = `data:${image.type};base64,${base64String}`;
    } else {
      try {
        console.log("Uploading photo to Firebase Storage...");
        const storagePath = `reports/${Date.now()}_${image.name.replace(/\s+/g, "_")}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadPromise = uploadBytes(storageRef, buffer, { contentType: image.type });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Storage upload timed out (1.5s limit).")), 1500)
        );

        await Promise.race([uploadPromise, timeoutPromise]);
        imageUrl = await getDownloadURL(storageRef);
      } catch (storageError: any) {
        console.warn("Firebase Storage failed or timed out. Falling back to Base64 inline storage:", storageError.message || storageError);
        const base64String = buffer.toString("base64");
        imageUrl = `data:${image.type};base64,${base64String}`;
      }
    }

    // 6. Write report to Firestore
    console.log("Saving report to Firestore...");
    const reportData = {
      title: `${aiResult.category} reported at ${address.split(",")[0]}`,
      description: description || "",
      category: aiResult.category,
      confidence: aiResult.confidence,
      severity: aiResult.severity,
      reasoning: aiResult.reasoning,
      riskScore: aiResult.riskScore || 0,
      urgencyWindow: aiResult.urgencyWindow || "Scheduled Maintenance",
      visualAudits: aiResult.visualAudits || [],
      impactedParties: aiResult.impactedParties || [],
      imageUrl,
      latitude,
      longitude,
      address,
      status: "Submitted",
      createdBy: createdBy || "anonymous",
      createdAt: new Date().toISOString(), // Use ISO string for ease of queries on SSR
      complaintDraft: aiResult.complaint || "",
    };

    const docRef = await addDoc(collection(db, "reports"), reportData);

    // 7. Update aggregated counters
    await updateAnalyticsSummary(aiResult.category, aiResult.severity);

    return NextResponse.json({
      success: true,
      reportId: docRef.id,
      data: {
        id: docRef.id,
        ...reportData,
      },
    });

  } catch (error: any) {
    console.error("API Report Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process and report civic issue." },
      { status: 500 }
    );
  }
}
