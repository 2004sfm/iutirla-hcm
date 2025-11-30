# Dashboard Layout - AdminLTE Style para IUTIRLA

Este documento explica la implementación del sidebar y header basados en AdminLTE 3, adaptados con los colores de IUTIRLA.

## 📁 Estructura de Componentes

```
components/
└── layout/
    ├── header.tsx          # Barra superior con búsqueda, notificaciones, mensajes y menú de usuario
    ├── sidebar.tsx         # Barra lateral con navegación colapsable
    └── dashboard-layout.tsx # Layout principal que combina Header y Sidebar
```

## 🎨 Características Implementadas

### Header (Barra Superior)

- **Logo IUTIRLA**: Con el color primario de la organización (#F213A4)
- **Botón de Toggle**: Para colapsar/expandir el sidebar
- **Barra de Búsqueda**: Responsive, oculta en móviles
- **Notificaciones**: 
  - Badge con contador (usando color terciario #F29F05)
  - Dropdown con lista de notificaciones
  - Iconos con colores de marca
- **Mensajes**:
  - Indicador de mensajes nuevos
  - Dropdown con vista previa de mensajes
- **Menú de Usuario**:
  - Avatar con color primario
  - Dropdown con perfil y configuración
  - Opción de cerrar sesión

### Sidebar (Barra Lateral)

- **Información de Usuario**: Avatar y rol
- **Navegación Jerárquica**:
  - Items principales con iconos
  - Subitems colapsables
  - Badges de notificación en diferentes colores:
    - `badge: { text: "8", variant: "tertiary" }` → Naranja
    - `badge: { text: "New", variant: "secondary" }` → Verde
- **Estados**:
  - Expandido (256px de ancho)
  - Colapsado (64px de ancho)
  - Tooltips cuando está colapsado
- **Footer**: Información de versión y copyright
- **Transiciones Suaves**: Animaciones de 300ms

### Layout

- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Fixed Header**: La barra superior permanece fija al hacer scroll
- **Fixed Sidebar**: La barra lateral permanece fija
- **Content Area**: Se ajusta automáticamente según el estado del sidebar

## 📸 Vistas del Dashboard

### Vista con Sidebar Expandido
![Dashboard Completo](file:///home/sss/.gemini/antigravity/brain/77d15cb0-96a3-493e-8480-a8c69f8be93d/dashboard_full_1764326827975.png)

### Vista con Sidebar Colapsado
![Dashboard Colapsado](file:///home/sss/.gemini/antigravity/brain/77d15cb0-96a3-493e-8480-a8c69f8be93d/dashboard_collapsed_1764326884753.png)

## 🚀 Uso

### Envolver una Página con el Layout

```tsx
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function MiPagina() {
  return (
    <DashboardLayout>
      <h1>Mi Contenido</h1>
      <p>El contenido de tu página va aquí</p>
    </DashboardLayout>
  );
}
```

### Personalizar el Menú del Sidebar

Edita el array `menuItems` en `/components/layout/sidebar.tsx`:

```tsx
const menuItems: MenuItem[] = [
  {
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: "Personal",
    badge: { text: "8", variant: "tertiary" }, // Badge naranja
    children: [
      { label: "Empleados", href: "/personal/empleados" },
      { label: "Candidatos", href: "/personal/candidatos" },
    ]
  },
  // ... más items
];
```

### Variantes de Badges

```tsx
// Primary (Magenta)
badge: { text: "New", variant: "primary" }

// Secondary (Verde)
badge: { text: "5", variant: "secondary" }

// Tertiary (Naranja)
badge: { text: "12", variant: "tertiary" }
```

## 🎯 Colores Aplicados

### Header
- **Logo**: `bg-brand-primary` (Magenta)
- **Búsqueda**: `bg-muted` (Gris neutral)
- **Badge de Notificaciones**: `bg-brand-tertiary` (Naranja)
- **Indicador de Mensajes**: `bg-brand-primary` (Magenta)
- **Avatar de Usuario**: `bg-brand-primary` (Magenta)

### Sidebar
- **Avatar de Usuario**: `bg-brand-primary` (Magenta)
- **Hover en Items**: `hover:text-brand-primary` (Magenta)
- **Items Activos**: `bg-muted` (Gris neutral)
- **Badges**: Usan los colores de marca según variante

### Interacciones
- **Hover**: Los iconos cambian a `text-brand-primary`
- **Focus**: Los campos de entrada usan `outline-ring` (color primario)
- **Dropdowns**: Fondo `bg-card` con bordes `border-border`

## 📱 Responsive

- **Desktop**: Sidebar completo visible por defecto
- **Tablet**: Sidebar permanece visible, se puede colapsar
- **Mobile**: 
  - Barra de búsqueda oculta
  - Nombre de usuario oculto en el header
  - Sidebar se puede colapsar para más espacio

## ⚙️ Personalización

### Cambiar el Ancho del Sidebar

En `sidebar.tsx`:
```tsx
className={cn(
  "fixed left-0 top-14 bottom-0 bg-card border-r border-border transition-all duration-300 z-40 overflow-hidden",
  collapsed ? "w-16" : "w-64"  // Cambia estos valores
)}
```

### Cambiar la Altura del Header

En `header.tsx`:
```tsx
<header className="fixed top-0 left-0 right-0 h-14 ...">  // Cambia h-14
```

Y en `sidebar.tsx` y `dashboard-layout.tsx`, cambia `top-14` y `pt-14` al mismo valor.

### Agregar Más Items al Menú de Usuario

En `header.tsx`, edita la sección del User Dropdown:
```tsx
<button className="w-full px-4 py-2 ...">
  <MiIcono className="w-4 h-4 text-muted-foreground" />
  Mi Nueva Opción
</button>
```

## 🔄 Animaciones

Todas las transiciones usan:
- **Duración**: 300ms
- **Easing**: Por defecto de Tailwind (cubic-bezier)
- **Propiedades**: `transition-all`, `transition-colors`, `transition-opacity`

## 🎨 Compatibilidad con shadcn/ui

Este layout es totalmente compatible con los componentes de shadcn/ui. Puedes usar:

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

<DashboardLayout>
  <Card>
    <Button variant="default">
      Este botón usa automáticamente el color primario de IUTIRLA
    </Button>
  </Card>
</DashboardLayout>
```

## 🐛 Troubleshooting

### El sidebar se superpone al contenido en móviles

Verifica que el `main` tenga los márgenes correctos:
```tsx
className={cn(
  "pt-14 transition-all duration-300",
  sidebarCollapsed ? "ml-16" : "ml-64"
)}
```

### Los dropdowns no se muestran

Asegúrate de que el z-index del header sea `z-50` y los dropdowns estén dentro del header o tengan un z-index mayor.

### Los colores de marca no se aplican

Verifica que estés usando las clases correctas:
- ✅ `bg-brand-primary` (Magenta)
- ✅ `bg-brand-secondary` (Verde)
- ✅ `bg-brand-tertiary` (Naranja)
- ❌ `bg-secondary` (Este es gris neutral del sistema)

## 📚 Recursos

- [AdminLTE 3 Demo](https://adminlte.io/themes/v3/index3.html)
- [IUTIRLA Color System](./COLOR_SYSTEM.md)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
