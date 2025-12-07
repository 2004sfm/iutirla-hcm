"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

interface CategoryScore {
    category: string;
    score: number;
    fullMark: number;
}

interface PerformanceRadarChartProps {
    data: CategoryScore[];
    title?: string;
    description?: string;
}

const chartConfig = {
    score: {
        label: "Puntaje",
        color: "var(--brand-primary)",
    },
} satisfies ChartConfig;

export function PerformanceRadarChart({ data, title, description }: PerformanceRadarChartProps) {
    return (
        <Card>
            <CardHeader className="items-center pb-4">
                <CardTitle>{title || "Radar Chart"}</CardTitle>
                <CardDescription>
                    {description || "Visualización del desempeño en las dimensiones evaluadas."}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[450px] min-h-[300px] w-full"
                >
                    <RadarChart data={data} outerRadius="65%" margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <PolarGrid />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
                        <Radar
                            dataKey="score"
                            fill="var(--color-score)"
                            fillOpacity={0.6}
                        />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
            {/* <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          January - June 2024
        </div>
      </CardFooter> */}
        </Card>
    );
}
