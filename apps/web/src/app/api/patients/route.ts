import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = searchParams.get("page") || "1";

    try {
        const res = await fetch(`http://localhost:3000/api/patients?search=${encodeURIComponent(search)}&page=${page}&limit=10`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
            next: { revalidate: 0 } // Bypass Next.js cache
        });

        if (!res.ok) {
            throw new Error(`Upstream API failed: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
