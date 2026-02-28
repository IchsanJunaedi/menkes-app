import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const payload = await request.json();

        // Inject mock practitioner/organization IDs for now until Phase 2 Auth contexts map User Profiles
        const enhancedPayload = {
            ...payload,
            practitionerId: "prac-req-active", // Will be automatically inferred by ABAC guard in production
            organizationId: "org-hq-main"       // Will be inferred from the user's active session role
        };

        const res = await fetch(`http://localhost:3000/api/encounters`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(enhancedPayload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `Upstream API failed: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
