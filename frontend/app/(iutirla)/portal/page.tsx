import Link from "next/link";
import { Briefcase, Users, Heart, TrendingUp, ArrowRight } from "lucide-react";

export default function IutirlaHomePage() {
    return (
        <div className="w-full">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 py-24 text-white">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="container relative z-10 mx-auto px-4">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
                            Construye tu futuro con{" "}
                            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                                IUTIRLA
                            </span>
                        </h1>
                        <p className="mb-8 text-xl text-blue-100 md:text-2xl">
                            Únete a un equipo apasionado por la excelencia educativa y el desarrollo profesional
                        </p>
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <Link
                                href="/portal/jobs"
                                className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-base font-medium text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Ver Vacantes Disponibles
                            </Link>
                            <Link
                                href="#"
                                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-8 text-base font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Conoce Nuestra Cultura
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50"></div>
            </section>

            {/* Cultura Organizacional */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-slate-900">
                            ¿Por qué trabajar en IUTIRLA?
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-slate-600">
                            Somos más que una institución educativa. Somos una familia comprometida con
                            la transformación de vidas a través de la educación.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group rounded-2xl bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="mb-6 inline-flex rounded-full bg-blue-100 p-4 transition-all group-hover:scale-110 group-hover:bg-blue-600">
                                    <feature.icon className="h-8 w-8 text-blue-600 transition-colors group-hover:text-white" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
                                <p className="text-slate-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Beneficios */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-slate-900">
                            Beneficios de ser parte del equipo
                        </h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-xl"
                            >
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="rounded-lg bg-green-100 p-2">
                                        <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                    </div>
                                    <h3 className="font-semibold text-slate-900">{benefit.title}</h3>
                                </div>
                                <p className="text-sm text-slate-600">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="bg-gradient-to-r from-blue-900 to-indigo-900 py-20 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-6 text-4xl font-bold">¿Listo para dar el siguiente paso?</h2>
                    <p className="mb-8 text-xl text-blue-100">
                        Explora nuestras vacantes y encuentra la oportunidad perfecta para ti
                    </p>
                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-blue-900 shadow-xl transition-all hover:scale-105"
                    >
                        Explorar Vacantes
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}

const features = [
    {
        icon: Briefcase,
        title: "Desarrollo Profesional",
        description: "Oportunidades continuas de capacitación y crecimiento en tu carrera.",
    },
    {
        icon: Users,
        title: "Equipo Colaborativo",
        description: "Trabaja con profesionales apasionados y comprometidos con la excelencia.",
    },
    {
        icon: Heart,
        title: "Ambiente Inclusivo",
        description: "Valoramos la diversidad y creamos un espacio donde todos prosperan.",
    },
    {
        icon: TrendingUp,
        title: "Impacto Real",
        description: "Tu trabajo transforma vidas y contribuye al futuro del país.",
    },
];

const benefits = [
    {
        title: "Seguro de Salud Integral",
        description: "Cobertura médica completa para ti y tu familia.",
    },
    {
        title: "Capacitación Continua",
        description: "Acceso a cursos, talleres y programas de desarrollo profesional.",
    },
    {
        title: "Flexibilidad Laboral",
        description: "Opciones de trabajo híbrido según el cargo y necesidades.",
    },
    {
        title: "Bonos de Desempeño",
        description: "Reconocimiento monetario por excelencia y resultados.",
    },
    {
        title: "Días de Descanso",
        description: "Vacaciones pagadas y días libres por ocasiones especiales.",
    },
    {
        title: "Ambiente Moderno",
        description: "Instalaciones equipadas con tecnología de punta.",
    },
];
