import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;

    try {
        const res = await fetch(`http://localhost:3000/api/patients/${patientId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            if (res.status === 404) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
            throw new Error(`Upstream API failed: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
