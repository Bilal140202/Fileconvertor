'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useConversionWorker } from '@/lib/utils/worker-client';
import { useConversionQueue } from '@/lib/queue';
import { FileUploader } from './FileUploader';
import { OptionsPanel } from './OptionsPanel';
import { ProgressTracker } from './ProgressTracker';
import { ConversionJob } from '@/lib/types';

interface ConversionJobForm {
  adapter: string;
  options: Record<string, any>;
}

export const ConverterInterface: React.FC = () => {
  const worker = useConversionWorker();
  const queue = useConversionQueue();
  
  const [adapters, setAdapters] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentJob, setCurrentJob] = useState<ConversionJobForm | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Load available adapters
  useEffect(() => {
    const loadAdapters = async () => {
      try {
        const availableAdapters = await worker.getAdapters();
        setAdapters(availableAdapters);
      } catch (error) {
        console.error('Failed to load adapters:', error);
      }
    };

    loadAdapters();
  }, [worker]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setCurrentJob(null);
  }, []);

  const handleJobConfig = useCallback((adapter: string, options: Record<string, any>) => {
    setCurrentJob({ adapter, options });
  }, []);

  const handleStartConversion = useCallback(async () => {
    if (!selectedFile || !currentJob) return;

    setIsConverting(true);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      const jobData = {
        tool: 'conversion',
        adapter: currentJob.adapter,
        input: {
          data: arrayBuffer,
          filename: selectedFile.name,
          mimeType: selectedFile.type,
        },
        options: currentJob.options,
      };

      // Start conversion with progress callback
      const jobId = await worker.startConversion(jobData, (progress) => {
        queue.updateJobProgress(jobId, progress);
      });

      console.log('Started conversion job:', jobId);

    } catch (error) {
      console.error('Failed to start conversion:', error);
      setIsConverting(false);
    }
  }, [selectedFile, currentJob, worker, queue]);

  const isReadyToConvert = selectedFile && currentJob && !isConverting;

  const inputFormat = selectedFile?.name.split('.').pop()?.toLowerCase();
  const availableAdapters = inputFormat 
    ? adapters.filter(adapter => 
        adapter.supportedFormats.input.includes(inputFormat)
      )
    : adapters;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Client-Side Conversion Engine
        </h1>
        <p className="text-gray-600">
          Convert files entirely in your browser using Web Workers and WASM
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <FileUploader 
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
      </div>

      {selectedFile && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Conversion Options</h2>
          
          {availableAdapters.length > 0 ? (
            <OptionsPanel
              adapters={availableAdapters}
              onJobConfig={handleJobConfig}
              currentJob={currentJob}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No conversion adapters available for {inputFormat} files
            </div>
          )}
        </div>
      )}

      {currentJob && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={handleStartConversion}
            disabled={!isReadyToConvert}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              isReadyToConvert
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isConverting ? 'Converting...' : 'Start Conversion'}
          </button>
        </div>
      )}

      <ProgressTracker />
    </div>
  );
};
