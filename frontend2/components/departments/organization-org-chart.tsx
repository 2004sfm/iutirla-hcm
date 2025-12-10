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
import { Building2, ChevronDown, Download, FileImage, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- TYPES ---
interface ManagerInfo {
    id: number;
    name: string;
    photo: string | null;
}

export interface DepartmentNodeData {
    id: number;
    name: string;
    parent_name?: string;
    parent?: { id: number; name: string } | null;
    manager_position?: string | null;
    manager_info?: ManagerInfo | null;
    isRoot?: boolean;
    showManagerPosition?: boolean;
    showManager?: boolean;
}

interface OrgChartProps {
    departments: DepartmentNodeData[];
}

// --- CUSTOM NODE ---
const DepartmentNode = ({ data }: { data: DepartmentNodeData }) => {
    const showManagerPosition = data.showManagerPosition || false;
    const showManager = data.showManager || false;

    return (
        <div className="w-[270px] relative">
            <Handle
                type="target"
                position={FlowPosition.Top}
                className="bg-transparent! w-px! h-px! min-w-0! min-h-0! border-0! top-0! -translate-y-1/2!"
            />

            <div className="flex flex-col rounded-lg overflow-hidden bg-white shadow-sm border border-slate-400 hover:border-slate-500 transition-all duration-200">
                {/* Header: Department Name */}
                <div className={`flex items-center justify-center px-2 h-[42px] text-center bg-slate-50 ${showManagerPosition ? 'border-b border-slate-300' : ''}`}>
                    <span className="text-[13px] leading-tight line-clamp-2 font-semibold text-slate-800" title={data.name}>
                        {data.name}
                    </span>
                </div>

                {/* Body: Manager Position and/or Manager Info */}
                {showManagerPosition && (
                    <>
                        {/* Manager Position Title */}
                        <div className={`h-[58px] flex items-center justify-center px-3 bg-white ${showManager && data.manager_info ? 'border-b border-slate-300' : ''}`}>
                            {data.manager_position ? (
                                <span className="text-[12px] text-slate-700 font-medium text-center line-clamp-2" title={data.manager_position}>
                                    {data.manager_position}
                                </span>
                            ) : (
                                <span className="text-[12px] text-slate-400 italic">Sin gerente asignado</span>
                            )}
                        </div>

                        {/* Manager Info (if showManager is true and manager exists) */}
                        {showManager && data.manager_info && (
                            <div className="h-[58px] flex items-center pl-[16px] pr-3 bg-white">
                                {/* Avatar */}
                                <div className="shrink-0 mr-[12px]">
                                    <Avatar className="h-[36px] w-[36px] border border-slate-300">
                                        <AvatarImage src={data.manager_info.photo || undefined} alt={data.manager_info.name} className="object-cover" />
                                        <AvatarFallback className="text-[10px] font-medium bg-slate-100 text-slate-600">
                                            {data.manager_info.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                {/* Name */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <span className="text-[12px] truncate font-medium leading-tight text-slate-700" title={data.manager_info.name}>
                                        {data.manager_info.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Empty state if showManager is true but no manager */}
                        {showManager && !data.manager_info && data.manager_position && (
                            <div className="h-[58px] flex items-center justify-center px-3 bg-white">
                                <User className="h-4 w-4 text-slate-400 mr-2" />
                                <span className="text-[12px] text-slate-400 italic">Vacante</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Handle
                type="source"
                position={FlowPosition.Bottom}
                className="bg-transparent! w-px! h-px! min-w-0! min-h-0! border-0! bottom-0! translate-y-1/2!"
            />
        </div>
    );
};

const nodeTypes = {
    department: DepartmentNode,
};

// --- LAYOUT HELPER ---
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 50 });

    const nodeWidth = 270;

    nodes.forEach((node) => {
        // Calculate dynamic height
        const data = node.data as DepartmentNodeData;
        let nodeHeight = 42; // Header

        if (data.showManagerPosition) {
            nodeHeight += 58; // Manager position row

            if (data.showManager) {
                if (data.manager_info || data.manager_position) {
                    nodeHeight += 58; // Manager info or vacancy row
                }
            }
        }

        node.height = nodeHeight;
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const nodeHeight = node.height || 42;
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

// --- MAIN COMPONENT ---
export function OrganizationOrgChart({ departments }: OrgChartProps) {
    return (
        <div className="h-[600px] w-full border rounded-md bg-white overflow-hidden relative group">
            <ReactFlowProvider>
                <OrgChartContent departments={departments} />
            </ReactFlowProvider>
        </div>
    );
}

function OrgChartContent({ departments }: OrgChartProps) {
    const { fitView } = useReactFlow();
    const [showManagerPosition, setShowManagerPosition] = useState(false);
    const [showManager, setShowManager] = useState(false);

    // Initial Data Calculation
    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Build map for quick access
        const deptMap = new Map(departments.map(d => [d.id, d]));

        departments.forEach((dept) => {
            const nodeId = `dept-${dept.id}`;
            const isRoot = !dept.parent;

            nodes.push({
                id: nodeId,
                type: "department",
                data: { ...dept, isRoot, showManagerPosition, showManager },
                position: { x: 0, y: 0 },
            });

            if (dept.parent) {
                const parentId = `dept-${dept.parent.id}`;
                // Only add edge if parent exists in the list
                if (deptMap.has(dept.parent.id)) {
                    edges.push({
                        id: `e-${parentId}-${nodeId}`,
                        source: parentId,
                        target: nodeId,
                        type: 'smoothstep',
                        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                    });
                }
            }
        });

        return { initialNodes: nodes, initialEdges: edges };
    }, [departments, showManagerPosition, showManager]);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        // Update toggle states in all nodes
        const updatedNodes = initialNodes.map(node => ({
            ...node,
            data: { ...node.data, showManagerPosition, showManager }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            updatedNodes,
            initialEdges
        );

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);

        setTimeout(() => {
            fitView({ padding: 0.2, duration: 800 });
        }, 50);

    }, [initialNodes, initialEdges, showManagerPosition, showManager, setNodes, setEdges, fitView]);

    return (
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
            <Panel position="top-right" className="flex items-center gap-2">
                {/* Toggle 1: Show Manager Position */}
                <div className="bg-white/90 backdrop-blur shadow-sm border rounded-md px-3 py-1.5 flex items-center gap-2">
                    <Label htmlFor="toggle-manager-position" className="text-xs font-medium text-slate-600 cursor-pointer">
                        Mostrar Posición Jefe
                    </Label>
                    <Switch
                        id="toggle-manager-position"
                        checked={showManagerPosition}
                        onCheckedChange={setShowManagerPosition}
                        className="scale-75"
                    />
                </div>

                {/* Toggle 2: Show Manager (only visible when position is shown) */}
                {showManagerPosition && (
                    <div className="bg-white/90 backdrop-blur shadow-sm border rounded-md px-3 py-1.5 flex items-center gap-2">
                        <Label htmlFor="toggle-manager" className="text-xs font-medium text-slate-600 cursor-pointer">
                            Mostrar Gerente
                        </Label>
                        <Switch
                            id="toggle-manager"
                            checked={showManager}
                            onCheckedChange={setShowManager}
                            className="scale-75"
                        />
                    </div>
                )}

                <DownloadButton showManagerPosition={showManagerPosition} showManager={showManager} />
            </Panel>
        </ReactFlow>
    );
}

// --- HELPER: GENERATE CLEAN SVG FROM REACT FLOW DATA ---
const generateInstitutionalOrgChartSVG = async (nodes: Node[], edges: Edge[], showManagerPosition: boolean, showManager: boolean) => {
    if (nodes.length === 0) return '';

    // 1. Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
        if (node.position.x < minX) minX = node.position.x;
        if (node.position.y < minY) minY = node.position.y;
        if (node.position.x + (node.width || 270) > maxX) maxX = node.position.x + (node.width || 270);
        if (node.position.y + (node.height || 42) > maxY) maxY = node.position.y + (node.height || 42);
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

    // 3. Build SVG
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${minX} ${minY} ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}">
    <style>
        .font-sans { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .text-dept { font-size: 13px; font-weight: 600; fill: #1e293b; dominant-baseline: middle; text-anchor: middle; }
        .text-position { font-size: 12px; font-weight: 500; fill: #334155; dominant-baseline: middle; text-anchor: middle; }
        .text-name { font-size: 12px; font-weight: 500; fill: #334155; dominant-baseline: middle; text-anchor: start; }
        .text-vacancy { font-size: 12px; fill: #94a3b8; font-style: italic; dominant-baseline: middle; text-anchor: middle; }
        .card-border { fill: #ffffff; stroke: #94a3b8; stroke-width: 1.5px; }
        .card-header { fill: #f8fafc; }
        .edge-path { stroke: #94a3b8; stroke-width: 1.5px; fill: none; }
    </style>
    <rect x="${minX}" y="${minY}" width="${viewWidth}" height="${viewHeight}" fill="#ffffff" />
    <g>`;

    // Draw Edges
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const srcHeight = sourceNode.height || 42;
        const sx = sourceNode.position.x + (sourceNode.width || 270) / 2;
        const sy = sourceNode.position.y + srcHeight;
        const tx = targetNode.position.x + (targetNode.width || 270) / 2;
        const ty = targetNode.position.y;

        const midY = sy + (ty - sy) / 2;
        const pathData = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
        svgContent += `<path d="${pathData}" class="edge-path" />`;
    });

    // Draw Nodes
    for (const node of nodes) {
        const data = node.data as DepartmentNodeData;
        const x = node.position.x;
        const y = node.position.y;
        const w = node.width || 270;
        const h = node.height || 42;
        const rx = 8;
        const headerHeight = 42;

        // Border on top
        svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="none" class="card-border" stroke="#94a3b8" stroke-width="1.5" />`;

        // Horizontal Separator 1 (Between Header and Next Row) - Only if there is content below
        if (showManagerPosition) {
            svgContent += `<line x1="${x}" y1="${y + headerHeight}" x2="${x + w}" y2="${y + headerHeight}" stroke="#cbd5e1" stroke-width="1" />`;
        }

        // Department Name - Text Wrapping Logic mimicking line-clamp-2
        const distinctWords = data.name.split(' ');
        let lines: string[] = [];
        let currentLine = distinctWords[0];

        // Approx character limit per line for 270px width (approx 240px usable) and 13px font
        // ~35-40 chars is a safe bet for sans-serif 13px
        const maxCharsPerLine = 35;

        for (let i = 1; i < distinctWords.length; i++) {
            if ((currentLine + " " + distinctWords[i]).length < maxCharsPerLine) {
                currentLine += " " + distinctWords[i];
            } else {
                lines.push(currentLine);
                currentLine = distinctWords[i];
            }
        }
        lines.push(currentLine);

        // Limit to 2 lines
        if (lines.length > 2) {
            lines = lines.slice(0, 2);
            lines[1] += '...'; // Add ellipsis if cut off
        }

        const lineHeight = 16;
        const totalTextHeight = lines.length * lineHeight;
        // Start Y to center the block vertically in the 42px header
        let startY = y + (headerHeight - totalTextHeight) / 2 + (lineHeight / 2) + 2; // +2 visual adjustment

        lines.forEach((line, index) => {
            svgContent += `<text x="${x + w / 2}" y="${startY + index * lineHeight}" class="text-dept font-sans">${esc(line)}</text>`;
        });

        // Manager Position (if shown)
        if (showManagerPosition && data.manager_position) {
            const posY = y + headerHeight + 29; // Center of 58px row
            svgContent += `<text x="${x + w / 2}" y="${posY}" class="text-position font-sans">${esc(data.manager_position)}</text>`;

            const secondRowY = y + headerHeight + 58;

            // Manager Info (if shown)
            if (showManager && data.manager_info) {
                // Horizontal Separator 2 (Between Position and Info)
                svgContent += `<line x1="${x}" y1="${secondRowY}" x2="${x + w}" y2="${secondRowY}" stroke="#cbd5e1" stroke-width="1" />`;

                const managerY = secondRowY + 29; // Center of second 58px row

                // Avatar (Circle + Initials)
                const avatarRadius = 18;
                const avatarX = x + 34; // Left margin + center of avatar area
                const avatarCenterY = managerY;

                // Avatar Circle
                svgContent += `<circle cx="${avatarX}" cy="${avatarCenterY}" r="${avatarRadius}" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" />`;

                // Avatar Initials
                const initials = data.manager_info.name ? data.manager_info.name.charAt(0).toUpperCase() : '?';
                svgContent += `<text x="${avatarX}" y="${avatarCenterY}" font-size="14" font-weight="600" fill="#475569" dominant-baseline="middle" text-anchor="middle" font-family="ui-sans-serif, system-ui">${initials}</text>`;

                // Name text (adjusted x position)
                svgContent += `<text x="${x + 64}" y="${managerY}" class="text-name font-sans">${esc(data.manager_info.name)}</text>`;

            } else if (showManager && !data.manager_info && data.manager_position) {
                // Horizontal Separator 2
                svgContent += `<line x1="${x}" y1="${secondRowY}" x2="${x + w}" y2="${secondRowY}" stroke="#cbd5e1" stroke-width="1" />`;

                // Vacancy Avatar placeholder
                const managerY = secondRowY + 29;
                const avatarRadius = 18;
                const avatarX = x + 34;

                svgContent += `<circle cx="${avatarX}" cy="${managerY}" r="${avatarRadius}" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1" />`;
                // Simple User Icon Path mimic
                svgContent += `<path d="M${avatarX} ${managerY - 2} a4 4 0 1 0 0 -8 a4 4 0 1 0 0 8 z M${avatarX - 6} ${managerY + 8} v-1 a5 5 0 0 1 10 0 v1" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />`;

                const vacancyY = secondRowY + 29;
                svgContent += `<text x="${x + 64}" y="${vacancyY}" class="text-vacancy font-sans" style="text-anchor: start;">Vacante</text>`;
            }
        }
    }

    svgContent += `</g></svg>`;
    return svgContent;
};

// --- DOWNLOAD BUTTON COMPONENT ---
function DownloadButton({ showManagerPosition, showManager }: { showManagerPosition: boolean, showManager: boolean }) {
    const { fitView, getNodes, getEdges } = useReactFlow();

    const downloadImage = async (format: 'png' | 'svg' | 'pdf') => {
        if (format === 'png') {
            // PNG: High-quality screenshot
            fitView({ padding: 0.2, duration: 0 });
            await new Promise(resolve => setTimeout(resolve, 100));

            const { toPng } = await import('html-to-image');
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
            a.setAttribute('download', 'organigrama-institucional.png');
            a.setAttribute('href', dataUrl);
            a.click();
        } else {
            // SVG/PDF: Generate clean SVG and send to backend
            try {
                const nodes = getNodes();
                const edges = getEdges();
                const svgContent = await generateInstitutionalOrgChartSVG(nodes, edges, showManagerPosition, showManager);
                if (!svgContent) {
                    alert("El gráfico está vacío o cargando.");
                    return;
                }

                const apiClient = (await import('@/lib/api-client')).default;
                const response = await apiClient.post(
                    `/api/organization/departments/export-institutional-chart/`,
                    { format, svg_content: svgContent },
                    { responseType: 'blob' }
                );

                const blob = response.data as Blob;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `organigrama-institucional.${format}`;
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
