'use client';

import React, { useEffect, useState } from 'react';
import { useConversionQueue } from '@/lib/queue';

export const ProgressTracker: React.FC = () => {
  const queue = useConversionQueue();
  const [jobs, setJobs] = useState(queue.getAllJobs());

  useEffect(() => {
    const unsubscribe = queue.addListener((job) => {
      setJobs(queue.getAllJobs());
    });

    // Update jobs on mount
    setJobs(queue.getAllJobs());

    return unsubscribe;
  }, [queue]);

  const activeJobs = jobs.filter(job => 
    job.status === 'pending' || job.status === 'processing'
  );

  const recentJobs = jobs
    .filter(job => job.status === 'completed' || job.status === 'error')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const formatDuration = (start: Date, end?: Date) => {
    const duration = (end || new Date()).getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadResult = async (job: any) => {
    // This would need to be implemented based on how results are stored
    console.log('Download result for job:', job.id);
  };

  if (activeJobs.length === 0 && recentJobs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Conversion Progress</h2>
      
      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900">Active Conversions</h3>
          {activeJobs.map(job => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {job.input.filename}
                  </p>
                  <p className="text-sm text-gray-500">
                    {job.adapter} • Started {formatDuration(job.createdAt)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              
              {job.progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{job.progress.message || 'Processing...'}</span>
                    <span>{job.progress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Conversions</h3>
          <div className="space-y-3">
            {recentJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {job.input.filename}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{job.adapter}</span>
                    <span>{formatDuration(job.createdAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  
                  {job.status === 'completed' && (
                    <button
                      onClick={() => downloadResult(job)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Download
                    </button>
                  )}
                  
                  {job.status === 'error' && job.progress?.message && (
                    <span className="text-red-600 text-sm" title={job.progress.message}>
                      Error
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {jobs.length > 5 && (
            <button
              onClick={() => queue.clearCompleted()}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear completed jobs
            </button>
          )}
        </div>
      )}
    </div>
  );
};
