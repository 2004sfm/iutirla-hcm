import {
    BookOpenText,
    BriefcaseBusiness,
    Building2,
    Calculator,
    CalendarRange,
    CalendarX,
    ClipboardList,
    Clock,
    ContactRound,
    FileText,
    Gauge,
    Goal,
    GraduationCap,
    Home,
    IdCard,
    ListChecks,
    MessagesSquare,
    Network,
    PiggyBank,
    Ticket,
    TrendingUp,
    TrendingUpDown,
    Users2,
    Watch,
    Crown
} from "lucide-react"

export const mainSiteSidebarItems = [
    {
        name: "administrador",
        href: "/admin",
        icon: Crown,
        showOnMobile: true,
        requiresAdmin: true,
    },
    {
        name: "Mi Expediente",
        href: "/employee", // Pendiente de crear (Perfil de solo lectura)
        icon: IdCard,
        showOnMobile: true,
    },
    {
        name: "equipos", // Nombre original mantenido
        href: "/teams",  // <--- CONECTADO: Vista de tarjetas de departamento
        icon: Users2,
        showOnMobile: true,
    },
    // {
    //     name: "Organigrama",
    //     href: "#",
    //     icon: Network,
    // },
    // {
    //     name: "Calendario",
    //     href: "#",
    //     icon: CalendarRange,
    //     showOnMobile: true,
    // },
    // {
    //     name: "Asistencia",
    //     href: "#",
    //     icon: Watch,
    // },
    // {
    //     name: "Ausencias",
    //     href: "#",
    //     icon: CalendarX,
    // },
    // {
    //     name: "Compensación",
    //     href: "#",
    //     icon: PiggyBank,
    // },
    // {
    //     name: "Objetivos",
    //     href: "#",
    //     icon: Goal,
    // },
    {
        name: "Desempeño", // Nombre original mantenido
        href: "/performance", // <--- CONECTADO: Hub de Evaluaciones
        icon: TrendingUp,
    },
    // {
    //     name: "Desarrollo",
    //     href: "#",
    //     icon: GraduationCap,
    // },
    {
        name: "Formación", // Nombre original mantenido
        href: "/learning", // <--- CONECTADO: Centro de Aprendizaje (Cursos)
        icon: BookOpenText,
    },
    // {
    //     name: "Feedback",
    //     href: "#",
    //     icon: MessagesSquare,
    // },
    // {
    //     name: "Encuestas",
    //     href: "#",
    //     icon: ListChecks,
    // },
    // {
    //     name: "Documentos",
    //     href: "#",
    //     icon: FileText,
    // },
    // {
    //     name: "Tickets",
    //     href: "#",
    //     icon: Ticket,
    // },
    // {
    //     name: "Portafolio",
    //     href: "#",
    //     icon: BriefcaseBusiness,
    // },
]

export const employeeSidebarItems = [
    {
        name: "Datos Personales",
        href: "/personal-data",
        icon: ContactRound,
    },
    {
        name: "Datos del Puesto",
        href: "/job-data",
        icon: Building2,
    },
    {
        name: "Compensación",
        href: "/compensation",
        icon: Calculator,
    },
    {
        name: "Gestión del Tiempo",
        href: "/time-management",
        icon: Clock,
    },
    {
        name: "Beneficios",
        href: "/benefits",
        icon: PiggyBank,
    }, {
        name: "Rendimiento y Metas",
        href: "/performance-goals",
        icon: Gauge,
    }, {
        name: "Sucesión",
        href: "/succession",
        icon: TrendingUpDown,
    }, {
        name: "Aprendizaje y Desarrollo",
        href: "/learning-development",
        icon: BookOpenText,
    }, {
        name: "Perfil de Talento",
        href: "/talent-profile",
        icon: ClipboardList,
    },
]