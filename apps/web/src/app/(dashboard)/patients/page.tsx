"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PatientsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Implementing standard 300ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['patients', debouncedSearch],
        queryFn: async () => {
            const response = await fetch(`/api/patients?search=${encodeURIComponent(debouncedSearch)}`);
            if (!response.ok) throw new Error('Failed to fetch patients');
            return response.json();
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Patients Repository</h2>
                    <p className="text-muted-foreground mt-1">
                        Search the Master Patient Index securely by NIK, BPJS Number, or Name.
                    </p>
                </div>
                <Button onClick={() => window.location.href = '/patients/new'}>
                    Register Patient
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search patients..."
                            className="pl-9 h-10 w-full md:w-1/3"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8 text-muted-foreground">Searching index...</div>
                    ) : isError ? (
                        <div className="text-red-500 text-center p-8">Failed to consult MPI database.</div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">NIK Identity</th>
                                        <th className="px-4 py-3 font-medium">BPJS Number</th>
                                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                No patients found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        data?.data?.map((patient: any) => (
                                            <tr key={patient.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 font-medium">{patient.name}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{patient.nik}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                    {patient.bpjsNumber || 'Unhandled'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/patients/${patient.id}`}>
                                                            View Profile
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
