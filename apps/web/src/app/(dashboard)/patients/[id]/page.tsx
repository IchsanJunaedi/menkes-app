"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, Plus, Activity, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function PatientProfilePage() {
    const params = useParams();
    const patientId = params.id as string;

    const { data: patient, isLoading, isError } = useQuery({
        queryKey: ['patient', patientId],
        queryFn: async () => {
            const response = await fetch(`/api/patients/${patientId}`);
            if (!response.ok) throw new Error('Failed to fetch patient profile');
            return response.json();
        }
    });

    if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading patient profile...</div>;
    if (isError) return <div className="p-8 text-red-500 font-medium">Failed to load Patient Data. Verify UUID is correct.</div>;
    if (!patient) return <div className="p-8">No records found.</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{patient.name}</h2>
                    <p className="text-muted-foreground mt-1 flex gap-4">
                        <span>NIK: {patient.nik}</span>
                        <span>Gender: {patient.gender}</span>
                        <span>DOB: {format(new Date(patient.birthDate), "dd MMM yyyy")}</span>
                    </p>
                </div>
                <Button className="gap-2" asChild>
                    <Link href={`/encounters/new?patientId=${patient.id}`}>
                        <Plus className="h-4 w-4" /> Start Encounter
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Core Demographics & Identity */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Demographics & Contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">BPJS Number</p>
                            <p className="font-medium">{patient.bpjsNumber || "Unregistered"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Phone Number</p>
                            <p className="font-medium">{patient.phone || "-"}</p>
                        </div>
                        <div className="col-span-2 mt-2">
                            <p className="text-muted-foreground mb-1">Primary Address</p>
                            <p className="font-medium">
                                {patient.addressLine ? `${patient.addressLine}, ` : ""}
                                {patient.addressCity ? `${patient.addressCity}, ` : ""}
                                {patient.addressProvince || "-"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Allergies Panel */}
                <Card className="border-red-100 dark:border-red-900/50">
                    <CardHeader className="bg-red-50 dark:bg-red-900/10 rounded-t-xl pb-4">
                        <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" /> Active Allergies
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {patient.allergies?.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No known allergies documented.</p>
                        ) : (
                            <ul className="space-y-3">
                                {patient.allergies?.map((allergy: any) => (
                                    <li key={allergy.id} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-sm">{allergy.substance}</span>
                                            <Badge variant={allergy.criticality === "HIGH" ? "destructive" : "secondary"}>
                                                {allergy.criticality}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground capitalize">{allergy.type.toLowerCase()} Reaction</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Medical Timeline */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" /> Medical Timeline
                        </CardTitle>
                        <CardDescription>Chronological history of recent encounters and facility visits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {patient.encounters?.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                No past encounters recorded.
                            </div>
                        ) : (
                            <div className="relative border-l border-muted ml-3 space-y-8 pb-4">
                                {patient.encounters?.map((enc: any) => (
                                    <div key={enc.id} className="mb-8 ml-6 relative">
                                        <span className="absolute -left-[35px] flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 ring-4 ring-background">
                                            <Calendar className="h-3 w-3 text-primary" />
                                        </span>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                {format(new Date(enc.startTime), "dd MMM yyyy, HH:mm")}
                                                <Badge variant={enc.status === "FINISHED" ? "default" : "outline"} className="text-[10px]">
                                                    {enc.status}
                                                </Badge>
                                            </h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3 font-medium">Class: {enc.class} | Facility: {enc.organization?.name}</p>

                                        <div className="bg-muted/50 rounded-md p-4 text-sm space-y-2">
                                            <p><span className="font-medium">Provider:</span> {enc.practitioner?.name}</p>
                                            {enc.diagnoses?.length > 0 && (
                                                <div>
                                                    <span className="font-medium mr-2">Diagnoses:</span>
                                                    {enc.diagnoses.map((d: any) => (
                                                        <Badge key={d.id} variant="secondary" className="mr-1">{d.code} - {d.display}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="link" size="sm" className="mt-2 px-0 text-muted-foreground hover:text-primary" asChild>
                                            <Link href={`/encounters/${enc.id}`}><FileText className="h-4 w-4 mr-2" /> View Clinical Record</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
