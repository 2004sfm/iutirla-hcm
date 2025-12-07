"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Briefcase, MapPin, Building2 } from "lucide-react";
import apiClient from "@/lib/api-client";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

interface JobPosting {
    id: number;
    title: string;
    description: string;
    location: string | null;
    position_title: string | null;
    department_name: string | null;
    status: string;
    published_date: string | null;
    closing_date: string | null;
    candidates_count: number;
}

export default function PerformanceModulePage() {
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Evaluación de Desempeño</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/admin/performance/periods">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <CardTitle>Periodos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Gestiona los periodos de evaluación
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/performance/reviews">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <CardTitle>Evaluaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Ver y gestionar evaluaciones de desempeño
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
