'use client';

import { useState } from 'react';
import { DropZone } from '@/components/DropZone';
import { Gallery } from '@/components/Gallery';
import { Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Home() {
  const [productImage, setProductImage] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [productCategory, setProductCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!productImage || !logoImage || !productCategory) {
      setError('Please fill in all fields and upload images.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResults([]);

    try {
      const formData = new FormData();
      formData.append('productImage', productImage);
      formData.append('logoImage', logoImage);
      formData.append('productCategory', productCategory);
      formData.append('productName', productName);

      const response = await axios.post('/api/generate', formData);
      setResults(response.data.results);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate creatives. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen p-8 md:p-24 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 mb-6">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-neutral-400">AI Creative Studio</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight pb-2">
          <span className="rich-gradient-text">Brand Creatives</span><br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Reimagined.</span>
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
          Upload your product and logo. Let our AI generate professional, high-converting ad creatives in seconds.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Assets
            </h2>

            <div className="space-y-4">
              <DropZone
                label="Product Image"
                onFileSelect={setProductImage}
              />
              <DropZone
                label="Brand Logo"
                onFileSelect={setLogoImage}
              />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h2 className="text-xl font-semibold">Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Nike Air Max"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Category / Context</label>
                <input
                  type="text"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  placeholder="e.g. Running Shoe, Luxury Perfume"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`
                w-full py-4 rounded-xl font-semibold text-lg transition-all
                ${isGenerating
                  ? 'bg-neutral-800 cursor-not-allowed text-neutral-500'
                  : 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                }
              `}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate Creatives'
              )}
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-8">
          {results.length > 0 ? (
            <Gallery results={results} />
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-neutral-600 border-2 border-dashed border-neutral-900 rounded-3xl">
              <Sparkles className="w-12 h-12 mb-4 opacity-20" />
              <p>Generated creatives will appear here</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
