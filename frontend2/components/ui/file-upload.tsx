"use client";

import { useCallback, useState, useEffect } from "react";
import { CloudUpload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
    ItemActions,
} from "@/components/ui/item";

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    accept?: string;
    currentFile?: File | null;
    initialPreviewUrl?: string | null;
    onRemove?: () => void;
}

export function FileUpload({ onFileSelect, accept = "image/*", currentFile, initialPreviewUrl, onRemove }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleRemove = useCallback(() => {
        onFileSelect(null);
        setPreviewUrl(null);
        if (onRemove) onRemove();
    }, [onFileSelect, onRemove]);

    // Generate preview URL when file changes
    useEffect(() => {
        if (currentFile && currentFile.type.startsWith("image/")) {
            const url = URL.createObjectURL(currentFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (!currentFile && initialPreviewUrl) {
            // If no new file selected but we have initial, revert to initial? 
            // Or if user removed it, we should respect that.
            // The handleRemove sets previewUrl to null, so we shouldn't automatically revert here unless we track "removed" state.
            // But for simplicity, if currentFile is null, we don't necessarily want to show initial if it was removed.
            // However, on mount, currentFile is null and initialPreviewUrl is set.
            // So we need to distinguish between "initial load" and "user removed file".
            // Actually, handleRemove sets previewUrl to null directly.
            // This useEffect runs when currentFile changes.
            // If currentFile becomes null (removed), we might not want to reset to initial.
            // Let's rely on state initialization for initialPreviewUrl and only update if currentFile is present.
        }
    }, [currentFile]);

    // If we have a preview URL (either from file or initial), show the item
    // We need a way to show the name/size for initial files too if possible, or just "Imagen Actual"

    const showPreview = previewUrl;
    const fileName = currentFile?.name || "Imagen Actual";
    const fileSize = currentFile ? (currentFile.size / 1024 / 1024).toFixed(2) + " MB" : "";

    if (showPreview) {
        return (
            <ItemGroup>
                <Item variant="outline">
                    <ItemMedia variant="image">
                        <img
                            src={previewUrl!}
                            alt={fileName}
                            className="object-cover"
                        />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle className="line-clamp-1">
                            {fileName}
                        </ItemTitle>
                        {fileSize && (
                            <ItemDescription>
                                {fileSize}
                            </ItemDescription>
                        )}
                    </ItemContent>
                    <ItemActions>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remover archivo</span>
                        </Button>
                    </ItemActions>
                </Item>
            </ItemGroup>
        );
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative flex flex-col items-center justify-center
                border-2 border-dashed rounded-lg
                p-8 transition-colors
                ${isDragging ? "border-primary bg-primary/5" : "border-gray-300"}
            `}
        >
            <CloudUpload className="h-12 w-12 text-gray-400 mb-4" />

            <p className="text-lg text-center font-medium text-gray-700 mb-2">
                Arrastra archivos aquí
            </p>

            <p className="text-sm text-gray-500 mb-4">o</p>

            <input
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
            />

            <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload-input")?.click()}
            >
                Buscar Archivos
            </Button>
        </div>
    );
}
