import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function ColorGuidePage() {
    const colors = [
        {
            name: 'Primary (Magenta)',
            hex: '#F213A4',
            variable: '--brand-primary',
            class: 'bg-brand-primary',
            textClass: 'text-brand-primary',
            description: 'Color principal de la marca. Usado para acciones principales, botones primarios y elementos destacados.',
        },
        {
            name: 'Secondary (Verde)',
            hex: '#15BF0F',
            variable: '--brand-secondary',
            class: 'bg-brand-secondary',
            textClass: 'text-brand-secondary',
            description: 'Color secundario. Usado para acciones de éxito, confirmación o elementos complementarios.',
        },
        {
            name: 'Tertiary (Naranja)',
            hex: '#FEC821',
            variable: '--brand-tertiary',
            class: 'bg-brand-tertiary',
            textClass: 'text-brand-tertiary',
            description: 'Color terciario. Usado para advertencias, destacados especiales o notas importantes.',
        },
        {
            name: 'Black',
            hex: '#000000',
            variable: '--brand-black',
            class: 'bg-brand-black',
            textClass: 'text-brand-black',
            description: 'Negro puro de la marca.',
        },
        {
            name: 'White',
            hex: '#FFFFFF',
            variable: '--brand-white',
            class: 'bg-brand-white',
            textClass: 'text-brand-white',
            description: 'Blanco puro de la marca.',
        },
    ];

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Guía de Colores IUTIRLA</h1>
                <p className="text-muted-foreground">
                    Referencia visual y técnica de los colores oficiales de la institución para el desarrollo frontend.
                </p>
            </div>

            <Separator />

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Paleta de Colores Oficial</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {colors.map((color) => (
                        <Card key={color.name} className="overflow-hidden">
                            <div
                                className="h-32 w-full transition-all hover:opacity-90"
                                style={{ backgroundColor: color.hex }}
                            />
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{color.name}</span>
                                </CardTitle>
                                <CardDescription className="font-mono text-xs">
                                    {color.hex}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    {color.description}
                                </p>
                                <div className="space-y-2 text-xs font-mono bg-muted p-3 rounded-md">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Variable:</span>
                                        <span>{color.variable}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Clase BG:</span>
                                        <span>{color.class}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Clase Texto:</span>
                                        <span>{color.textClass}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <Separator />

            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Ejemplos de Uso</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Botones y Elementos UI</CardTitle>
                            <CardDescription>Cómo se aplican los colores en componentes comunes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                                <Button className="bg-[#F213A4] hover:bg-[#F213A4]/90">
                                    Primary Button
                                </Button>
                                <Button className="bg-[#15BF0F] hover:bg-[#15BF0F]/90 text-white">
                                    Secondary Button
                                </Button>
                                <Button className="bg-[#FEC821] hover:bg-[#FEC821]/90 text-black">
                                    Tertiary Button
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-4">
                                <Badge className="bg-[#F213A4] hover:bg-[#F213A4]/90">Primary Badge</Badge>
                                <Badge className="bg-[#15BF0F] hover:bg-[#15BF0F]/90">Secondary Badge</Badge>
                                <Badge className="bg-[#FEC821] hover:bg-[#FEC821]/90 text-black">Tertiary Badge</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tipografía y Fondos</CardTitle>
                            <CardDescription>Ejemplos de contraste y legibilidad.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg border" style={{ borderColor: '#F213A4' }}>
                                <h3 className="font-bold" style={{ color: '#F213A4' }}>Texto Primario</h3>
                                <p className="text-sm text-muted-foreground">
                                    Este contenedor tiene un borde primario y título primario.
                                </p>
                            </div>

                            <div className="p-4 rounded-lg bg-[#15BF0F]/10 border" style={{ borderColor: '#15BF0F' }}>
                                <h3 className="font-bold" style={{ color: '#15BF0F' }}>Texto Secundario</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fondo con opacidad y texto secundario.
                                </p>
                            </div>

                            <div className="p-4 rounded-lg bg-[#FEC821]/10 border" style={{ borderColor: '#FEC821' }}>
                                <h3 className="font-bold" style={{ color: '#FEC821' }}>Texto Terciario</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fondo con opacidad y texto terciario.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <Separator />

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Notas de Implementación</h2>
                <div className="prose dark:prose-invert max-w-none">
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            El color <strong>Primary</strong> (#F213A4) se usa automáticamente en componentes shadcn con <code>variant="default"</code>.
                        </li>
                        <li>
                            Los colores <strong>Secondary</strong> (#15BF0F) y <strong>Tertiary</strong> (#FEC821) deben aplicarse explícitamente usando clases de utilidad o estilos en línea.
                        </li>
                        <li>
                            <strong>Importante:</strong> Las variables <code>--secondary</code> y <code>--accent</code> de shadcn son grises neutrales, NO los colores de la marca. Usa <code>--brand-secondary</code> para el verde oficial.
                        </li>
                        <li>
                            Para gráficos (Charts), se deben especificar los colores manualmente usando el array de colores de la marca.
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
