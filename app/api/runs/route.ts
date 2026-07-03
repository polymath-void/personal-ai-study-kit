import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, query, orderBy, deleteDoc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch runs
    const runsRef = collection(db, "runs");
    const runsQuery = query(runsRef, orderBy("updatedAt", "desc"));
    const runsSnap = await getDocs(runsQuery);
    
    const runsList = runsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 2. Fetch global analytics
    const globalRef = doc(db, "analytics", "global");
    const globalSnap = await getDoc(globalRef);
    const globalData = globalSnap.exists() ? globalSnap.data() : {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      runsCount: 0,
    };

    return NextResponse.json({
      runs: runsList,
      analytics: globalData
    });
  } catch (error: any) {
    console.error("Failed to fetch runs/analytics:", error);
    return NextResponse.json({ error: error.message || "Failed to load runs" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Run ID is required" }, { status: 400 });
    }
    const runRef = doc(db, "runs", id);
    await deleteDoc(runRef);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete run:", error);
    return NextResponse.json({ error: error.message || "Failed to delete run" }, { status: 500 });
  }
}
