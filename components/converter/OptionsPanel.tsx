'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface Adapter {
  id: string;
  name: string;
  description: string;
  category: string;
  supportedFormats: {
    input: string[];
    output: string[];
  };
  capabilities: string[];
  optionsSchema: Record<string, any>;
}

interface OptionsPanelProps {
  adapters: Adapter[];
  onJobConfig: (adapter: string, options: Record<string, any>) => void;
  currentJob: { adapter: string; options: Record<string, any> } | null;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({ 
  adapters, 
  onJobConfig, 
  currentJob 
}) => {
  const [selectedAdapter, setSelectedAdapter] = useState<string>(
    currentJob?.adapter || adapters[0]?.id || ''
  );
  const [options, setOptions] = useState<Record<string, any>>(
    currentJob?.options || {}
  );

  const currentAdapter = adapters.find(a => a.id === selectedAdapter);

  // Update options when adapter changes
  useEffect(() => {
    if (currentAdapter && !currentJob) {
      // Set default options for new adapter
      const defaultOptions: Record<string, any> = {};
      Object.entries(currentAdapter.optionsSchema).forEach(([key, schema]) => {
        if (schema.default !== undefined) {
          defaultOptions[key] = schema.default;
        }
      });
      setOptions(defaultOptions);
    }
  }, [selectedAdapter, currentAdapter, currentJob]);

  // Notify parent when configuration changes
  useEffect(() => {
    if (selectedAdapter && Object.keys(options).length > 0) {
      onJobConfig(selectedAdapter, options);
    }
  }, [selectedAdapter, options, onJobConfig]);

  const handleOptionChange = useCallback((key: string, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const renderOptionInput = (key: string, schema: any) => {
    const value = options[key] ?? schema.default;

    switch (schema.type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleOptionChange(key, e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              {schema.label}
            </label>
          </div>
        );

      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {schema.label}
            </label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleOptionChange(key, parseInt(e.target.value) || 0)}
              min={schema.min}
              max={schema.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {schema.description && (
              <p className="mt-1 text-xs text-gray-500">{schema.description}</p>
            )}
          </div>
        );

      case 'range':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {schema.label} ({value})
            </label>
            <input
              type="range"
              value={value || schema.default}
              onChange={(e) => handleOptionChange(key, parseInt(e.target.value))}
              min={schema.min}
              max={schema.max}
              step={schema.step}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            {schema.description && (
              <p className="mt-1 text-xs text-gray-500">{schema.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {schema.label}
            </label>
            <select
              value={value || schema.default}
              onChange={(e) => handleOptionChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {schema.options?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {schema.description && (
              <p className="mt-1 text-xs text-gray-500">{schema.description}</p>
            )}
          </div>
        );

      case 'string':
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {schema.label}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleOptionChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={schema.placeholder}
            />
            {schema.description && (
              <p className="mt-1 text-xs text-gray-500">{schema.description}</p>
            )}
          </div>
        );
    }
  };

  if (!currentAdapter) {
    return (
      <div className="text-center py-8 text-gray-500">
        No conversion options available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Adapter Selection */}
      {adapters.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conversion Method
          </label>
          <select
            value={selectedAdapter}
            onChange={(e) => setSelectedAdapter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {adapters.map(adapter => (
              <option key={adapter.id} value={adapter.id}>
                {adapter.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {currentAdapter.description}
          </p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Conversion Settings</h3>
        
        {Object.entries(currentAdapter.optionsSchema).map(([key, schema]) => (
          <div key={key}>
            {renderOptionInput(key, schema)}
          </div>
        ))}
      </div>

      {/* Capabilities */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Capabilities</h4>
        <div className="flex flex-wrap gap-2">
          {currentAdapter.capabilities.map(capability => (
            <span
              key={capability}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {capability}
            </span>
          ))}
        </div>
      </div>

      {/* Supported Formats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Input Formats</h4>
          <div className="flex flex-wrap gap-1">
            {currentAdapter.supportedFormats.input.map(format => (
              <span
                key={format}
                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
              >
                {format.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Output Formats</h4>
          <div className="flex flex-wrap gap-1">
            {currentAdapter.supportedFormats.output.map(format => (
              <span
                key={format}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
              >
                {format.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
