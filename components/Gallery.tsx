'use client';

import JSZip from 'jszip';
import { Download, Copy, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface Result {
    image: string;
    caption: string;
    prompt: string;
}

interface GalleryProps {
    results: Result[];
}

export function Gallery({ results }: GalleryProps) {
    if (results.length === 0) return null;

    const handleDownloadZip = async () => {
        const zip = new JSZip();
        const folder = zip.folder("creatives");


        await Promise.all(results.map(async (result, index) => {

            const response = await fetch(result.image);
            const blob = await response.blob();


            folder?.file(`variation-${index + 1}.png`, blob);


            folder?.file(`variation-${index + 1}-caption.txt`, result.caption);
        }));


        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = "brand-creatives.zip";
        link.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="mt-12 space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-white">Generated Results</h3>
                <button
                    onClick={handleDownloadZip}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                >
                    <Package className="w-4 h-4" />
                    Download All (ZIP)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.map((result, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800"
                    >
                        <div className="aspect-square relative overflow-hidden">
                            <img
                                src={result.image}
                                alt={`Variation ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = result.image;
                                        link.download = `creative-variation-${index + 1}.png`;
                                        link.click();
                                    }}
                                    className="self-end bg-white text-black p-2 rounded-full hover:bg-neutral-200 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <p className="text-neutral-300 text-sm leading-relaxed font-medium">
                                "{result.caption}"
                            </p>
                            <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between items-center">
                                <span className="text-xs text-neutral-500 uppercase tracking-wider">Variation {index + 1}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(result.caption)}
                                    className="text-neutral-500 hover:text-white transition-colors"
                                    title="Copy Caption"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
