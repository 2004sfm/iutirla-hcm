# Sistema de Colores IUTIRLA - Frontend2

Este documento explica cómo usar el sistema de colores de IUTIRLA en el frontend2.

## Colores de la Organización

Según el `organization-manual.md`, los colores oficiales de IUTIRLA son:

- **Primary (Magenta)**: `#F213A4`
- **Secondary (Verde)**: `#15BF0F`
- **Tertiary (Naranja)**: `#F29F05`
- **Black**: `#000000`
- **White**: `#FFFFFF`

## Cómo Funcionan los Colores

### 1. Colores de Marca (Brand Colors)

Estos colores están disponibles como variables CSS y clases de Tailwind **SOLO cuando los uses explícitamente**:

#### Variables CSS:
```css
--brand-primary           /* #F213A4 - Magenta */
--brand-primary-foreground

--brand-secondary         /* #15BF0F - Verde */
--brand-secondary-foreground

--brand-tertiary          /* #F29F05 - Naranja */
--brand-tertiary-foreground

--brand-black            /* #000000 */
--brand-white            /* #FFFFFF */
```

#### Clases de Tailwind:
```tsx
// Background
<div className="bg-brand-primary">
<div className="bg-brand-secondary">
<div className="bg-brand-tertiary">

// Text
<p className="text-brand-primary">
<p className="text-brand-secondary">
<p className="text-brand-tertiary">

// Borders
<div className="border-brand-primary">
<div className="border-brand-secondary">
<div className="border-brand-tertiary">

// Con foreground automático
<button className="bg-brand-secondary text-brand-secondary-foreground">
  Botón Verde
</button>
```

### 2. Colores del Sistema shadcn

Los componentes de shadcn usan estas variables automáticamente:

- **`primary`**: Usa el color magenta de IUTIRLA (`#F213A4`)
- **`secondary`**: Gris neutral claro (NO es el verde de IUTIRLA)
- **`accent`**: Gris neutral claro
- **`muted`**: Gris neutral muy claro
- **`destructive`**: Rojo para acciones destructivas

**IMPORTANTE**: Las variables `--secondary` y `--accent` de shadcn son **GRISES NEUTRALES**, NO los colores secondary y tertiary de IUTIRLA. Esto es intencional para evitar que los componentes de shadcn apliquen automáticamente los colores verde y naranja en hovers, estados activos, etc.

### 3. Charts (Gráficos)

Los colores de charts son **neutrales por defecto**. Si quieres usar los colores de IUTIRLA en un chart, debes especificarlo manualmente:

```tsx
// ❌ NO usar directamente chart-1, chart-2, etc. si quieres colores de marca
<BarChart data={data} />

// ✅ Especificar colores de marca explícitamente
<BarChart 
  data={data}
  colors={[
    'hsl(var(--brand-primary))',
    'hsl(var(--brand-secondary))',
    'hsl(var(--brand-tertiary))'
  ]}
/>
```

## Ejemplos de Uso

### Ejemplo 1: Botón con color primario de IUTIRLA
```tsx
import { Button } from '@/components/ui/button';

// Este botón usa automáticamente el magenta (#F213A4) porque primary = brand-primary
<Button variant="default">
  Iniciar Sesión
</Button>
```

### Ejemplo 2: Card con acento secundario de IUTIRLA
```tsx
// Usar explícitamente el verde de IUTIRLA
<div className="bg-brand-secondary text-brand-secondary-foreground p-6 rounded-lg">
  <h2 className="text-xl font-bold">Aviso Importante</h2>
  <p>Este es un mensaje con el color secundario de IUTIRLA.</p>
</div>
```

### Ejemplo 3: Badge con color terciario
```tsx
import { Badge } from '@/components/ui/badge';

// Badge normal usa colores del sistema
<Badge>Normal</Badge>

// Badge con color terciario de IUTIRLA (naranja)
<Badge className="bg-brand-tertiary text-brand-tertiary-foreground">
  Destacado
</Badge>
```

### Ejemplo 4: Mezclar colores del sistema con colores de marca
```tsx
<div className="bg-background border border-border p-4 rounded-lg">
  <h3 className="text-brand-primary font-bold text-lg mb-2">
    Título en Magenta
  </h3>
  <p className="text-foreground mb-4">
    Texto normal del sistema
  </p>
  <Button className="bg-brand-secondary text-brand-secondary-foreground hover:opacity-90">
    Acción Verde
  </Button>
</div>
```

## Reglas Importantes

1. **Primary automático**: Todos los componentes de shadcn que usen `variant="default"` o color `primary` usarán el magenta de IUTIRLA automáticamente.

2. **Secondary y Tertiary explícitos**: Los colores verde (`brand-secondary`) y naranja (`brand-tertiary`) SOLO se aplican cuando los uses explícitamente con las clases `bg-brand-secondary`, `text-brand-tertiary`, etc.

3. **No confundir**: 
   - `bg-secondary` = gris neutral claro (shadcn)
   - `bg-brand-secondary` = verde #15BF0F (IUTIRLA)

4. **Charts personalizados**: Siempre especifica los colores de marca manualmente en charts si los quieres usar.

5. **Consistencia**: Usa `primary` (magenta) para acciones principales, y `brand-secondary` (verde) y `brand-tertiary` (naranja) solo cuando quieras jerarquía visual adicional o llamar la atención específicamente.

## Modo Oscuro

En modo oscuro, los colores de marca se ajustan ligeramente para mejor legibilidad:

- `brand-primary`: Ligeramente más claro
- `brand-secondary`: Ligeramente más claro  
- `brand-tertiary`: Ligeramente más claro

Los colores del sistema (background, foreground, card, etc.) cambian completamente para el tema oscuro.

## Variables en CSS Puro

Si necesitas usar las variables en CSS puro:

```css
.mi-componente {
  background-color: oklch(var(--brand-primary));
  color: oklch(var(--brand-primary-foreground));
}

.mi-componente:hover {
  background-color: oklch(var(--brand-secondary));
  color: oklch(var(--brand-secondary-foreground));
}
```

## Resumen Rápido

| Cuándo usar | Clase/Variable |
|-------------|---------------|
| Acción principal, botones primarios | `bg-primary` (automático magenta) |
| Elementos neutrales, secundarios | `bg-secondary` (gris neutral) |
| Avisos, alertas positivas | `bg-brand-secondary` (verde) |
| Destacados, advertencias suaves | `bg-brand-tertiary` (naranja) |
| Errores, eliminaciones | `bg-destructive` (rojo) |
| Fondos neutros | `bg-muted` (gris muy claro) |
