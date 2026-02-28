"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Activity, Pill, Microscope, CheckCircle2, Upload, FileImageIcon } from "lucide-react";

export default function ActiveEncounterWorkspace() {
    const params = useParams();
    const encounterId = params.id as string;
    const queryClient = useQueryClient();

    const { data: encounter, isLoading } = useQuery({
        queryKey: ['encounter', encounterId],
        queryFn: async () => {
            const response = await fetch(`/api/encounters/${encounterId}`);
            if (!response.ok) throw new Error('Failed to load active encounter');
            return response.json();
        }
    });

    const { data: patient, isLoading: patientLoading } = useQuery({
        queryKey: ['patient', encounter?.patientId],
        queryFn: async () => {
            const response = await fetch(`/api/patients/${encounter?.patientId}`);
            return response.json();
        },
        enabled: !!encounter?.patientId
    });

    const [medicationInput, setMedicationInput] = useState({ drugName: "", dosage: "", instructions: "" });
    const [allergyWarning, setAllergyWarning] = useState<string | null>(null);

    const prescribeMutation = useMutation({
        mutationFn: async (payload: any) => {
            const response = await fetch(`http://localhost:3000/api/encounters/${encounterId}/medications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Mocking Auth Headers temporarily for direct proxy bypass testing
                    'Authorization': `Bearer ${localStorage.getItem('temp_token') || 'bypass_mock_in_development'}`
                },
                body: JSON.stringify(payload)
            });
            if (response.status === 409) {
                const err = await response.json();
                throw new Error(err.message || 'Severe Allergy Conflict Detected');
            }
            if (!response.ok) throw new Error('Failed to prescribe medication');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['encounter', encounterId] });
            setMedicationInput({ drugName: "", dosage: "", instructions: "" });
            setAllergyWarning(null);
        },
        onError: (error: any) => {
            if (error.message.includes('Allergy Conflict')) {
                setAllergyWarning(error.message);
            } else {
                console.error(error);
            }
        }
    });

    const finishMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/encounters/${encounterId}/finish`, { method: 'PATCH' });
            if (!response.ok) throw new Error('Failed to lock encounter context.');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['encounter', encounterId] });
        }
    });

    const handlePrescribe = (e: React.FormEvent) => {
        e.preventDefault();
        // Locally check against patient allergies first before pushing to backend
        const conflict = patient?.allergies?.find(
            (a: any) => medicationInput.drugName.toLowerCase().includes(a.substance.toLowerCase())
        );

        if (conflict) {
            setAllergyWarning(`SEVERE CONFLICT: Patient has a known ${conflict.criticality} allergy to ${conflict.substance}! Prescribing ${medicationInput.drugName} is locked.`);
            return;
        }

        prescribeMutation.mutate({
            medicationName: medicationInput.drugName,
            dosageInstruction: medicationInput.dosage,
            status: "ACTIVE"
        });
    };

    if (isLoading || patientLoading) return <div className="p-8 text-center animate-pulse">Loading clinical workspace...</div>;
    if (!encounter) return <div className="p-8 text-red-500">Encounter context lost.</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Activity className="h-6 w-6 text-primary" /> Active Encounter
                        <Badge variant={encounter.status === "FINISHED" ? "default" : "outline"}>{encounter.status}</Badge>
                    </h2>
                    <p className="text-muted-foreground mt-1">Patient: {patient?.name} | NIK: {patient?.nik}</p>
                </div>
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    disabled={encounter.status === "FINISHED" || finishMutation.isPending}
                    onClick={() => {
                        if (window.confirm("Are you sure you want to finish this encounter? No further vitals or prescriptions can be added.")) {
                            finishMutation.mutate();
                        }
                    }}
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {finishMutation.isPending ? "Locking..." : "Finish Encounter"}
                </Button>
            </div>

            <Tabs defaultValue="vitals" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="vitals">Vitals & SOAP</TabsTrigger>
                    <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
                    <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="vitals" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Clinical Observations (SOAP)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Chief Complaint: <strong>{encounter.reasonCode}</strong></p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Systolic (mmHg)</Label>
                                    <Input type="number" placeholder="120" disabled={encounter.status === 'FINISHED'} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Diastolic (mmHg)</Label>
                                    <Input type="number" placeholder="80" disabled={encounter.status === 'FINISHED'} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Heart Rate (BPM)</Label>
                                    <Input type="number" placeholder="72" disabled={encounter.status === 'FINISHED'} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Temperature (°C)</Label>
                                    <Input type="number" placeholder="36.5" step="0.1" disabled={encounter.status === 'FINISHED'} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="prescriptions" className="mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> E-Prescribing</CardTitle>
                                <CardDescription>Issue medications against the active encounter.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePrescribe} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Drug / Substance Name</Label>
                                        <Input required value={medicationInput.drugName} onChange={e => setMedicationInput({ ...medicationInput, drugName: e.target.value })} placeholder="e.g. Amoxicillin 500mg" disabled={encounter.status === "FINISHED"} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dosage Instructions</Label>
                                        <Input required value={medicationInput.dosage} onChange={e => setMedicationInput({ ...medicationInput, dosage: e.target.value })} placeholder="e.g. 3x1 after meals for 5 days" disabled={encounter.status === "FINISHED"} />
                                    </div>

                                    {allergyWarning && (
                                        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 rounded-md flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                                            <div className="text-sm font-medium">{allergyWarning}</div>
                                        </div>
                                    )}

                                    {encounter.status === "FINISHED" ? (
                                        <div className="text-muted-foreground italic text-sm text-center py-4 border rounded bg-muted/20">Encounter locked. No further prescriptions valid.</div>
                                    ) : (
                                        <Button type="submit" disabled={prescribeMutation.isPending} className="w-full">
                                            Add Prescription Target
                                        </Button>
                                    )}
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Scripts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {encounter.medications?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground whitespace-nowrap">No medications prescribed yet.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {encounter.medications?.map((med: any) => (
                                            <li key={med.id} className="p-3 border rounded-md">
                                                <div className="font-semibold text-primary">{med.medicationName}</div>
                                                <div className="text-sm text-muted-foreground">{med.dosageInstruction}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="diagnoses" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Microscope className="h-5 w-5" /> Diagnoses List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="py-8 border-dashed border-2 rounded-lg text-center text-muted-foreground">
                                ICD-10 Registry integration available in Phase 2.3
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileImageIcon className="h-5 w-5" /> Clinical Documents Upload</CardTitle>
                            <CardDescription>Drag and drop imaging results, lab scans, or external PDFs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                                <h3 className="font-semibold text-lg mb-1">Click to upload or drag and drop</h3>
                                <p className="text-sm text-muted-foreground">SVG, PNG, JPG, or PDF (max. 10MB)</p>
                            </div>

                            <div className="mt-6 space-y-4 hidden">
                                {/* Hidden Phase 2.3 MinIO Mapping Skeleton */}
                                <div className="border rounded-md p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 w-full pr-8">
                                        <FileImageIcon className="h-8 w-8 text-blue-500 shrink-0" />
                                        <div className="w-full">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium">chest_xray_scan.jpg</span>
                                                <span className="text-muted-foreground">75%</span>
                                            </div>
                                            <Progress value={75} className="h-2" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
