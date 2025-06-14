import React, { memo } from 'react';

const SkeletonBox = ({ className = '', width = 'w-full', height = 'h-4' }) => (
  <div 
    className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${width} ${height} ${className}`}
  />
);

const UserTableSkeleton = () => (
  <div className="space-y-4">
    {/* Header skeleton */}
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <SkeletonBox width="w-32" height="h-6" />
      <SkeletonBox width="w-24" height="h-8" />
    </div>
    
    {/* User rows skeleton */}
    {[...Array(5)].map((_, index) => (
      <div key={index} className="flex items-center p-4 border-b border-gray-100 dark:border-gray-800">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mr-4" />
        
        {/* User info */}
        <div className="flex-1 space-y-2">
          <SkeletonBox width="w-48" height="h-4" />
          <SkeletonBox width="w-64" height="h-3" />
          <SkeletonBox width="w-32" height="h-3" />
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          <SkeletonBox width="w-16" height="h-8" />
          <SkeletonBox width="w-16" height="h-8" />
        </div>
      </div>
    ))}
  </div>
);

const CardSkeleton = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
    <div className="space-y-4">
      <SkeletonBox height="h-6" width="w-3/4" />
      <SkeletonBox height="h-4" width="w-full" />
      <SkeletonBox height="h-4" width="w-5/6" />
      <div className="flex space-x-2 mt-4">
        <SkeletonBox height="h-8" width="w-20" />
        <SkeletonBox height="h-8" width="w-24" />
      </div>
    </div>
  </div>
);

const GridSkeleton = ({ items = 6, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {[...Array(items)].map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
);

const ListSkeleton = ({ items = 5, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {[...Array(items)].map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <SkeletonBox height="h-4" width="w-3/4" />
          <SkeletonBox height="h-3" width="w-1/2" />
        </div>
        <SkeletonBox height="h-8" width="w-20" />
      </div>
    ))}
  </div>
);

const FormSkeleton = ({ fields = 4, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {[...Array(fields)].map((_, index) => (
      <div key={index} className="space-y-2">
        <SkeletonBox height="h-4" width="w-24" />
        <SkeletonBox height="h-10" width="w-full" />
      </div>
    ))}
    <div className="flex space-x-4 pt-4">
      <SkeletonBox height="h-10" width="w-24" />
      <SkeletonBox height="h-10" width="w-20" />
    </div>
  </div>
);

const PageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <SkeletonBox height="h-8" width="w-64" className="mb-2" />
        <SkeletonBox height="h-4" width="w-96" />
      </div>
      
      {/* Actions */}
      <div className="flex space-x-4 mb-6">
        <SkeletonBox height="h-10" width="w-32" />
        <SkeletonBox height="h-10" width="w-28" />
        <SkeletonBox height="h-10" width="w-24" />
      </div>
      
      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <UserTableSkeleton />
      </div>
    </div>
  </div>
);

const SkeletonLoader = {
  Box: memo(SkeletonBox),
  UserTable: memo(UserTableSkeleton),
  Card: memo(CardSkeleton),
  Grid: memo(GridSkeleton),
  List: memo(ListSkeleton),
  Form: memo(FormSkeleton),
  Page: memo(PageSkeleton)
};

export default SkeletonLoader; 