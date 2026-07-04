import { NextRequest, NextResponse } from "next/server";
import { getFirebaseDb } from "@/lib/firebase-server";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function GET() {
  const db = getFirebaseDb();
  if (!db) {
    return NextResponse.json({
      guardState: {
        totalRequests: 0,
        totalPushes: 0,
        totalCommits: 0,
        topicsCreated: 0,
        topics: {}
      },
      stats: {
        apiCalls: 0,
        promptTokens: 0,
        completionTokens: 0,
        cost: 0,
        completedAngles: 0,
        completedRounds: 0,
        totalCompletions: 0
      },
      promptHistory: []
    });
  }

  try {
    const docRef = doc(db, "telemetry", "global_state");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data());
    } else {
      return NextResponse.json({
        guardState: {
          totalRequests: 0,
          totalPushes: 0,
          totalCommits: 0,
          topicsCreated: 0,
          topics: {}
        },
        stats: {
          apiCalls: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          completedAngles: 0,
          completedRounds: 0,
          totalCompletions: 0
        },
        promptHistory: []
      });
    }
  } catch (error: any) {
    console.error("Firestore GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const db = getFirebaseDb();
  if (!db) {
    return NextResponse.json({ error: "Firebase not initialized" }, { status: 500 });
  }

  try {
    const payload = await req.json();
    const { guardState, stats, promptHistory } = payload;

    const docRef = doc(db, "telemetry", "global_state");
    await setDoc(docRef, {
      guardState: guardState || {},
      stats: stats || {},
      promptHistory: promptHistory || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Firestore POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
