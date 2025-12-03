'use client';

import { Upload, Image as ImageIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

interface DropZoneProps {
    label: string;
    onFileSelect: (file: File) => void;
    accept?: string;
}

export function DropZone({ label, onFileSelect, accept = 'image/*' }: DropZoneProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            onFileSelect(file);
            setPreview(URL.createObjectURL(file));
        }
    }, [onFileSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            setPreview(URL.createObjectURL(file));
        }
    }, [onFileSelect]);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
        relative group cursor-pointer
        border-2 border-dashed rounded-xl p-8
        transition-all duration-200 ease-out
        flex flex-col items-center justify-center gap-4
        min-h-[200px]
        ${isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50'
                }
      `}
        >
            <input
                type="file"
                accept={accept}
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {preview ? (
                <div className="relative w-full h-full min-h-[160px] flex items-center justify-center">
                    <img
                        src={preview}
                        alt="Preview"
                        className="max-h-[160px] object-contain rounded-lg shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <p className="text-white font-medium">Change Image</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-neutral-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-neutral-200 font-medium">{label}</p>
                        <p className="text-neutral-500 text-sm mt-1">Drag & drop or click to upload</p>
                    </div>
                </>
            )}
        </div>
    );
}
