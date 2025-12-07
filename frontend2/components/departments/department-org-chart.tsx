"use client";

import { useMemo, useState, useEffect } from "react";
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    Position as FlowPosition,
    useNodesState,
    useEdgesState,
    Handle,
    Panel,
    useReactFlow,
    ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Star, User, Download, ChevronDown, FileImage, FileText } from "lucide-react";

// --- TYPES ---
interface Occupant {
    id: number;
    name: string;
    email: string | null;
    photo: string | null;
    is_current_user: boolean;
}

interface PositionData {
    id: number;
    name: string;
    is_manager: boolean;
    vacancies: number;
    occupants: Occupant[];
    manager_positions: { id: number; name: string }[];
    isRoot?: boolean;
}

interface OrgChartProps {
    positions: PositionData[];
    departmentId: number;
}

// --- CUSTOM NODE ---
// --- CUSTOM NODE ---
// --- CUSTOM NODE ---
const EmployeeNode = ({ data }: { data: PositionData & { showEmployees: boolean } }) => {
    const occupant = data.occupants[0];
    const isVacancy = !occupant;
    const showEmployees = data.showEmployees;

    // Derived styles to match SVG/PDF exactly
    const isManager = data.is_manager;

    // Exact sizing from SVG generation:
    // Width: 270px
    // Header Height: 42px
    // Body Height: 58px (Total 100px)
    // Avatar Left: 16px
    // Font Header: 13px
    // Font Name: 12px

    // PDF Style Replication:
    // Manager: Yellow Border (#fbbf24), Header Bg (#f8fafc).
    // Others: Slate Border (#cbd5e1), Header Bg (#f8fafc).

    return (
        <div className="w-[270px] relative">
            <Handle
                type="target"
                position={FlowPosition.Top}
                className="!bg-transparent !w-px !h-px !min-w-0 !min-h-0 !border-0 !top-0 !-translate-y-1/2"
            />

            <div className={`
                flex flex-col rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-200 border transform-gpu 
                ${isManager ? "border-amber-400 ring-1 ring-amber-400/20" : "border-slate-400 hover:border-slate-500"}
            `}>
                {/* Header: Position Name */}
                <div className={`
                    flex items-center justify-center px-2 h-[42px] text-center shrink-0
                    ${showEmployees ? 'border-b' : ''}
                    ${isManager ? 'bg-slate-50 border-slate-300' : 'bg-slate-50 border-slate-300'}
                `}>
                    <span className={`text-[13px] leading-tight line-clamp-2 ${isManager ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`} title={data.name}>
                        {data.name}
                    </span>
                </div>

                {/* Body: Employee Info (Conditional) List */}
                {showEmployees && (
                    <div className="flex flex-col bg-white shrink-0 relative">
                        {/* 1. Render Occupants */}
                        {data.occupants.map((occupant, index) => (
                            <div key={`occ-${occupant.id}`} className="h-[58px] flex items-center pl-[16px] pr-3 border-t border-slate-300 first:border-t-0 relative">
                                {/* Avatar */}
                                <div className="shrink-0 mr-[12px]">
                                    <Avatar className="h-[36px] w-[36px] border border-slate-300">
                                        <AvatarImage src={occupant?.photo || undefined} alt={occupant?.name} className="object-cover" />
                                        <AvatarFallback className="text-[10px] font-medium bg-slate-100 text-slate-600">
                                            {occupant?.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                {/* Name */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <span className={`text-[12px] truncate font-medium leading-tight ${occupant.is_current_user ? "text-blue-600" : "text-slate-700"}`} title={occupant.name}>
                                        {occupant.name}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* 2. Render Vacancies */}
                        {Array.from({ length: Math.max(0, data.vacancies || 0) }).map((_, index) => (
                            <div key={`vac-${index}`} className="h-[58px] flex items-center pl-[16px] pr-3 border-t border-slate-300 first:border-t-0 relative">
                                <div className="shrink-0 mr-[12px]">
                                    <div className="h-[36px] w-[36px] rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <User className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <span className="text-[12px] text-slate-400 italic font-medium">Vacante</span>
                                </div>
                            </div>
                        ))}

                        {/* 3. Empty State fallback (if neither occupants nor vacancies) */}
                        {data.occupants.length === 0 && (data.vacancies || 0) === 0 && (
                            <div className="h-[58px] flex items-center pl-[16px] pr-3 border-t border-slate-300 first:border-t-0 relative">
                                <div className="shrink-0 mr-[12px]">
                                    <div className="h-[36px] w-[36px] rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <User className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <span className="text-[12px] text-slate-400 italic font-medium">Vacante</span>
                                </div>
                            </div>
                        )}

                        {/* Manager Icon Indicator (Only on first row? or floating? Floating looks better for 'Position' level) */}
                        {data.is_manager && !data.isRoot && (
                            <div className="absolute right-3 top-[29px] -translate-y-1/2 z-10" title="Posición Gerencial">
                                <div className="h-5 w-5 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={FlowPosition.Bottom}
                className="!bg-transparent !w-px !h-px !min-w-0 !min-h-0 !border-0 !bottom-0 !translate-y-1/2"
            />
        </div>
    );
};

const nodeTypes = {
    employee: EmployeeNode,
};

// --- HELPER: GENERATE CLEAN SVG FROM REACT FLOW DATA ---
const generateOrgChartSVG = async (nodes: Node[], edges: Edge[], width: number, height: number, showEmployees: boolean) => {
    if (nodes.length === 0) return '';

    // 1. Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
        if (node.position.x < minX) minX = node.position.x;
        if (node.position.y < minY) minY = node.position.y;
        if (node.position.x + (node.width || 270) > maxX) maxX = node.position.x + (node.width || 270);
        if (node.position.y + (node.height || (showEmployees ? 100 : 50)) > maxY) maxY = node.position.y + (node.height || (showEmployees ? 100 : 50));
    });

    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
        return '';
    }

    // Add padding
    const padding = 50;
    minX -= padding; minY -= padding;
    maxX += padding; maxY += padding;
    const viewWidth = maxX - minX;
    const viewHeight = maxY - minY;

    // 2. Helper to escape XML special chars
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // 3. Helper to fetch image and convert to base64
    const getBase64Image = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return null;
        }
    };

    // 4. Build SVG parts
    // Using standard Tailwind colors for "Premium" look

    // UPDATED COLORS PER USER REQUEST:
    // Card border: #cbd5e1 (slate-300) - was 200
    // Header bg (Position): #f8fafc (slate-50) for ALL, including manager

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${minX} ${minY} ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}">
    <style>
        .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .text-position { font-size: 13px; font-weight: 600; fill: #0f172a; dominant-baseline: middle; text-anchor: middle; }
        .text-name { font-size: 12px; font-weight: 500; fill: #334155; dominant-baseline: middle; text-anchor: start; }
        .text-vacancy { font-size: 12px; fill: #94a3b8; font-style: italic; dominant-baseline: middle; text-anchor: start; }
        
        .card-base { fill: #ffffff; stroke: #94a3b8; stroke-width: 1.5px; }
        .card-manager { stroke: #94a3b8; stroke-width: 1.5px; }
        .card-border { fill: none; stroke: #94a3b8; stroke-width: 1.5px; }
        .card-header { fill: #f8fafc; }
        
        .badge-manager { fill: #fffbeb; stroke: #fbbf24; }
        .badge-text { font-size: 10px; fill: #b45309; font-weight: 600; text-anchor: middle; dominant-baseline: middle; }
        
        .edge-path { stroke: #94a3b8; stroke-width: 2px; fill: none; }
    </style>
    <rect x="${minX}" y="${minY}" width="${viewWidth}" height="${viewHeight}" fill="#ffffff" /> 
    <g>`;

    // Draw Edges
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        // Visual height logic matching functionality
        const visualHeightExpanded = 100;
        const visualHeightCollapsed = 42;
        const srcHeight = showEmployees ? visualHeightExpanded : visualHeightCollapsed;

        const sx = sourceNode.position.x + (sourceNode.width || 270) / 2;
        const sy = sourceNode.position.y + srcHeight;
        const tx = targetNode.position.x + (targetNode.width || 270) / 2;
        const ty = targetNode.position.y;

        // Actually, previous logic assumed fixed visualHeightExpanded=100.
        // But now nodes have variable heights.
        // We must trust the Edge source handle, but here we are manual drawing.
        // The source handle is at Bottom. 
        // node.height was updated in layout.

        const realSrcHeight = sourceNode.height || (showEmployees ? 100 : 42);

        const sx_real = sourceNode.position.x + (sourceNode.width || 270) / 2;
        const sy_real = sourceNode.position.y + realSrcHeight;

        const midY = sy_real + (ty - sy_real) / 2;

        const pathData = `M ${sx_real} ${sy_real} L ${sx_real} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;

        svgContent += `<path d="${pathData}" class="edge-path" />`;
    });

    // Draw Nodes
    for (const node of nodes) {
        const x = node.position.x;
        const y = node.position.y;
        const w = node.width || 270;

        // Use the calculated layout height
        const visualHeight = node.height || (showEmployees ? 100 : 42);
        const headerHeight = 42;
        const rowHeight = 58;

        const data = node.data as PositionData;

        const occupants = data.occupants || [];
        const vacancies = data.vacancies || 0;

        // Determine Rows
        let rows: { type: 'occupant' | 'vacancy', data?: Occupant }[] = [];
        occupants.forEach(occ => rows.push({ type: 'occupant', data: occ }));
        for (let i = 0; i < vacancies; i++) rows.push({ type: 'vacancy' });

        // Is Empty? Fallback
        if (rows.length === 0) rows.push({ type: 'vacancy' });

        const isManager = data.is_manager;

        // CARD CONTAINER
        // Main Border Rect
        const strokeClass = isManager ? "card-manager" : "card-base";
        const rx = 8;

        // Clip path for main card
        const cardClipId = `card-clip-${node.id}`;
        svgContent += `<defs><clipPath id="${cardClipId}"><rect x="${x}" y="${y}" width="${w}" height="${visualHeight}" rx="${rx}" ry="${rx}" /></clipPath></defs>`;

        // 1. Draw Base Card Background (No Border yet)
        svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${visualHeight}" rx="${rx}" ry="${rx}" fill="#ffffff" />`;

        // 2. HEADER Background
        svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${headerHeight}" class="card-header" clip-path="url(#${cardClipId})" />`;

        // Position Name Text
        svgContent += `<text x="${x + w / 2}" y="${y + headerHeight / 2 + 1}" class="text-position font-sans">${esc(data.name)}</text>`;

        // BODY (Rows)
        if (showEmployees) {
            let currentY = y + headerHeight;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const centerY = currentY + rowHeight / 2;

                // Separator (except first)
                if (i > 0) {
                    svgContent += `<line x1="${x}" y1="${currentY}" x2="${x + w}" y2="${currentY}" stroke="#cbd5e1" stroke-width="1" />`;
                } else {
                    // Main header separator
                    svgContent += `<line x1="${x}" y1="${currentY}" x2="${x + w}" y2="${currentY}" stroke="#cbd5e1" stroke-width="1" />`;
                }

                // Avatar
                const avatarSize = 36;
                const avatarX = x + 16;
                const avatarY = centerY - avatarSize / 2;

                const avatarClipId = `avatar-clip-${node.id}-${i}`;
                svgContent += `<defs><clipPath id="${avatarClipId}"><circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" /></clipPath></defs>`;
                svgContent += `<circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" />`;

                if (row.type === 'occupant' && row.data?.photo) {
                    const base64Photo = await getBase64Image(row.data.photo);
                    if (base64Photo) {
                        svgContent += `<image xlink:href="${base64Photo}" x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" clip-path="url(#${avatarClipId})" preserveAspectRatio="xMidYMid slice" />`;
                    }
                } else {
                    // Fallback Icon -> Initials to match Frontend AvatarFallback
                    // Frontend: bg-slate-100 (#f1f5f9), text-slate-600 (#475569), font-medium
                    // Circle background is already drawn above.
                    const initial = row.type === 'occupant' ? row.data!.name.charAt(0).toUpperCase() : "";

                    if (initial) {
                        svgContent += `<text x="${avatarX + avatarSize / 2}" y="${avatarY + avatarSize / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="600" fill="#475569" class="font-sans">${initial}</text>`;
                    } else {
                        // Vacancy Icon Fallback (keep icon for Vacancy)
                        svgContent += `<g transform="translate(${avatarX + 9}, ${avatarY + 9}) scale(0.75)">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#94a3b8" stroke-width="2" fill="none"/>
                            <circle cx="12" cy="7" r="4" stroke="#94a3b8" stroke-width="2" fill="none"/>
                        </g>`;
                    }
                }

                // Text
                const textX = avatarX + avatarSize + 12;
                const name = row.type === 'occupant' ? row.data!.name : "Vacante";
                const textClass = row.type === 'vacancy' ? "text-vacancy" : "text-name";

                svgContent += `<text x="${textX}" y="${centerY}" class="${textClass} font-sans">${esc(name)}</text>`;

                // Advance Y
                currentY += rowHeight;
            }

            // Manager Badge (Only on first row logic or floating?)
            // Floating in CSS, but in SVG hard to float. We'll put it on top right of the *first* row's area visually.
            if (isManager && !data.isRoot) {
                const badgeSize = 20;
                const badgeX = x + w - badgeSize - 12;
                const badgeY = (y + headerHeight + rowHeight / 2) - badgeSize / 2; // Vertically centered on first row

                svgContent += `<circle cx="${badgeX + badgeSize / 2}" cy="${badgeY + badgeSize / 2}" r="${badgeSize / 2}" fill="#fffbeb" stroke="#fbbf24" stroke-width="1" />`;
                svgContent += `<path d="M${badgeX + 6} ${badgeY + 8} l1.5 -4.5 l1.5 4.5 h4.5 l-3.5 2.5 l1.5 4.5 l-3.5 -2.5 l-3.5 2.5 l1.5 -4.5 l-3.5 -2.5 z" fill="#fbbf24" transform="scale(0.5) translate(${badgeX * 2}, ${badgeY * 2})" />`;
            }

        }

        // Draw Card Border ON TOP to ensure uniform thickness
        // Header background won't overlap half the stroke now.
        // Use separate class or reuse logic
        const borderStrokeClass = isManager ? "card-manager" : "card-border";
        // Actually card-manager in style has stroke. We need 'fill: none' for this top rect.
        svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${visualHeight}" rx="${rx}" ry="${rx}" class="${borderStrokeClass}" fill="none" />`;
    }

    svgContent += `</g></svg>`;
    return svgContent;
};

// --- DOWNLOAD BUTTON COMPONENT ---
function DownloadButton({ departmentId, showEmployees }: { departmentId: number, showEmployees: boolean }) {
    const { fitView, getNodes, getEdges } = useReactFlow();

    const downloadImage = async (format: 'png' | 'pdf' | 'svg') => {
        if (format === 'png') {
            // PNG: High-quality screenshot
            fitView({ padding: 0.2, duration: 0 });
            await new Promise(resolve => setTimeout(resolve, 100));

            const container = document.querySelector('.react-flow') as HTMLElement;
            if (!container) return;

            const dataUrl = await toPng(container, {
                backgroundColor: '#ffffff',
                fontEmbedCSS: '',
                pixelRatio: 4,
                filter: (node) => {
                    const element = node as HTMLElement;
                    if (element.classList) {
                        return !['react-flow__controls', 'react-flow__panel', 'react-flow__attribution'].some(c => element.classList.contains(c));
                    }
                    return true;
                }
            });

            const a = document.createElement('a');
            a.setAttribute('download', 'organigrama-departamento.png');
            a.setAttribute('href', dataUrl);
            a.click();
        } else {
            // PDF/SVG: Generate clean SVG from layout data and send to backend
            try {
                const nodes = getNodes();
                const edges = getEdges();
                const svgContent = await generateOrgChartSVG(nodes, edges, 0, 0, showEmployees);
                if (!svgContent) {
                    alert("El gráfico está vacío o cargando.");
                    return;
                }

                const apiClient = (await import('@/lib/api-client')).default;
                const response = await apiClient.post(
                    `/api/organization/departments/${departmentId}/export-org-chart/`,
                    { format, svg_content: svgContent },
                    { responseType: 'blob' }
                );

                const blob = response.data as Blob;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `organigrama-departamento.${format}`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Export error:', error);
                alert('Error al exportar el organigrama');
            }
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm shadow-sm">
                    <Download className="mr-2 size-4" />
                    Descargar
                    <ChevronDown className="ml-2 size-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadImage('png')}>
                    <FileImage className="mr-2 size-4" />
                    Imagen (PNG)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadImage('svg')}>
                    <FileImage className="mr-2 size-4" />
                    Vector (SVG)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadImage('pdf')}>
                    <FileText className="mr-2 size-4" />
                    Documento (PDF)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// --- LAYOUT HELPER ---
const getLayoutedElements = (nodes: Node[], edges: Edge[], showEmployees: boolean) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "TB", ranksep: 60, nodesep: 30 }); // Tighter packing

    const nodeWidth = 270;

    // 1. Calculate Real Heights and build Hierarchy for Top Alignment
    const nodeHeights: Record<string, number> = {};
    const nodeLevels: Record<string, number> = {};
    const childrenMap: Record<string, string[]> = {};
    const parentMap: Record<string, string[]> = {}; // for finding roots

    nodes.forEach(node => {
        const data = node.data as PositionData;
        const rowCount = Math.max(1, (data.occupants?.length || 0) + (data.vacancies || 0));
        const h = showEmployees ? 42 + (rowCount * 58) : 42;
        nodeHeights[node.id] = h;
        node.height = h;
        node.width = nodeWidth;

        childrenMap[node.id] = [];
        if (!parentMap[node.id]) parentMap[node.id] = [];
    });

    edges.forEach(edge => {
        if (childrenMap[edge.source]) childrenMap[edge.source].push(edge.target);
        if (!parentMap[edge.target]) parentMap[edge.target] = [];
        parentMap[edge.target].push(edge.source);
    });

    // 2. BFS for Levels
    const queue: { id: string, level: number }[] = [];

    // Find roots (nodes with no parents within the graph subset)
    nodes.forEach(node => {
        if ((parentMap[node.id] || []).length === 0) {
            queue.push({ id: node.id, level: 0 });
        }
    });

    const maxHeightsByLevel: Record<number, number> = {};

    while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        if (nodeLevels[id] !== undefined) continue; // Visited

        nodeLevels[id] = level;

        // Update Max Height for this level
        const h = nodeHeights[id];
        if (!maxHeightsByLevel[level] || h > maxHeightsByLevel[level]) {
            maxHeightsByLevel[level] = h;
        }

        // Add children
        const children = childrenMap[id] || [];
        children.forEach(childId => {
            queue.push({ id: childId, level: level + 1 });
        });
    }

    // 3. Set Graph with Uniform Heights per Level (Logic for Top Alignment)
    nodes.forEach((node) => {
        const level = nodeLevels[node.id] || 0;
        // Use Max Height of the level so Dagre spaces them evenly for that row
        const uniformHeight = maxHeightsByLevel[level] || nodeHeights[node.id];

        dagreGraph.setNode(node.id, { width: nodeWidth, height: uniformHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    // 4. Apply positions
    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const level = nodeLevels[node.id] || 0;
        const uniformHeight = maxHeightsByLevel[level] || node.height || 42;

        // Calculate Top-Left Position
        // Since we lied to Dagre about height (using uniformHeight), nodeWithPosition.y is center of that large box.
        // Subtracting half of uniformHeight gives us the Top Y shared by all in this row.
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - uniformHeight / 2,
        };
    });

    return { nodes, edges };
};

// --- MAIN COMPONENT ---
export function DepartmentOrgChart({ positions, departmentId }: OrgChartProps) {
    return (
        <div className="h-[600px] w-full border rounded-md bg-white overflow-hidden relative group">
            <ReactFlowProvider>
                <DepartmentOrgChartContent positions={positions} departmentId={departmentId} />
            </ReactFlowProvider>
        </div>
    );
}

function DepartmentOrgChartContent({ positions, departmentId }: OrgChartProps) {
    const { fitView } = useReactFlow();
    const [showEmployees, setShowEmployees] = useState(true);

    // Initial Data Calculation
    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Helper to find root
        const isRootPosition = (pos: PositionData) => {
            if (pos.manager_positions.length === 0) return true;
            return !pos.manager_positions.some(manager => positions.some(p => p.id === manager.id));
        };

        positions.forEach((pos) => {
            const isRoot = isRootPosition(pos);
            const nodeId = `pos-${pos.id}`;

            // One node per position, passing all occupants
            nodes.push({
                id: nodeId,
                type: "employee",
                data: { ...pos, isRoot, showEmployees }, // pos contains occupants array
                position: { x: 0, y: 0 },
            });
        });

        // Edges
        positions.forEach((pos) => {
            // My ID is pos.id
            const targetId = `pos-${pos.id}`;

            pos.manager_positions.forEach((manager) => {
                // Check if manager exists in our set
                if (positions.some(p => p.id === manager.id)) {
                    const sourceId = `pos-${manager.id}`;
                    edges.push({
                        id: `e-${sourceId}-${targetId}`,
                        source: sourceId,
                        target: targetId,
                        type: 'step',
                        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                    });
                }
            });
        });

        return { initialNodes: nodes, initialEdges: edges };
    }, [positions]); // Dependencies

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Effect to update layout when showEmployees changes
    useEffect(() => {
        // Update data in all nodes
        const updatedNodes = initialNodes.map(node => ({
            ...node,
            data: { ...node.data, showEmployees }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            updatedNodes,
            initialEdges,
            showEmployees
        );

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);

        // Fit view after small delay to allow render
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 800 });
        }, 50);

    }, [initialNodes, initialEdges, showEmployees, setNodes, setEdges, fitView]);

    return (
        <>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.1}
            >
                <Controls showInteractive={false} />
                <Background color="#ffffff" gap={20} />

                {/* Custom Controls Panel */}
                <Panel position="top-right" className="flex items-center gap-2">
                    <div className="bg-white/90 backdrop-blur shadow-sm border rounded-md px-3 py-1.5 flex items-center gap-2">
                        <Label htmlFor="toggle-employees" className="text-xs font-medium text-slate-600 cursor-pointer">
                            Mostrar Empleados
                        </Label>
                        <Switch
                            id="toggle-employees"
                            checked={showEmployees}
                            onCheckedChange={setShowEmployees}
                            className="scale-75"
                        />
                    </div>
                    <DownloadButton departmentId={departmentId} showEmployees={showEmployees} />
                </Panel>
            </ReactFlow>
        </>
    );
}

