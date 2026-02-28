"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowRight, Loader2 } from "lucide-react";

export default function NewEncounterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientId = searchParams.get('patientId');

    const [encounterClass, setEncounterClass] = useState("AMB");
    const [chiefComplaint, setChiefComplaint] = useState("");

    const { data: patient, isLoading: patientLoading } = useQuery({
        queryKey: ['patient', patientId],
        queryFn: async () => {
            const response = await fetch(`/api/patients/${patientId}`);
            if (!response.ok) throw new Error('Patient lookup failed');
            return response.json();
        },
        enabled: !!patientId,
    });

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            const response = await fetch('/api/encounters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Failed to create encounter');
            return response.json();
        },
        onSuccess: (data) => {
            router.push(`/encounters/${data.id}`);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !chiefComplaint) return;

        mutation.mutate({
            patientId,
            class: encounterClass,
            priority: "ROUTINE",
            status: "IN_PROGRESS",
            reasonCode: chiefComplaint
        });
    };

    if (!patientId) {
        return (
            <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                No Patient ID provided. Please start an encounter from the Patient Dashboard.
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight">Initiate Encounter</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Clinical Context</CardTitle>
                    <CardDescription>
                        {patientLoading ? <span className="animate-pulse">Locating patient...</span> : (
                            <span>Starting secure session for <strong>{patient?.name}</strong> (NIK: {patient?.nik})</span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="class">Encounter Classification</Label>
                            <Select defaultValue="AMB" onValueChange={setEncounterClass}>
                                <SelectTrigger id="class">
                                    <SelectValue placeholder="Select patient class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AMB">Ambulatory (Outpatient)</SelectItem>
                                    <SelectItem value="IMP">Inpatient</SelectItem>
                                    <SelectItem value="EMER">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="complaint">Chief Complaint / Visit Reason</Label>
                            <Textarea
                                id="complaint"
                                placeholder="e.g., Patient complaining of severe abdominal pain for 48 hours..."
                                rows={4}
                                value={chiefComplaint}
                                onChange={(e) => setChiefComplaint(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={mutation.isPending || !chiefComplaint}
                        >
                            {mutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Committing block...</>
                            ) : (
                                <>Open Medical Workspace <ArrowRight className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>

                    </form>
                </CardContent>
            </Card>
            {mutation.isError && (
                <div className="p-4 bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400 rounded-md text-sm font-medium text-center">
                    Unable to generate session UUID: {mutation.error.message}
                </div>
            )}
        </div>
    );
}
