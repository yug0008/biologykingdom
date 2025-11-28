export const ChapterOverviewSkeleton = () => (
  <div className="space-y-6">
    {/* Progress Overview Skeleton */}
    <div>
      <div className="h-8 w-48 bg-gray-700 rounded mb-6 animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-700/50 border border-gray-600 rounded-xl p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-20 bg-gray-600 rounded"></div>
              <div className="h-5 w-5 bg-gray-600 rounded"></div>
            </div>
            <div className="h-8 w-12 bg-gray-600 rounded mb-1"></div>
            <div className="h-3 w-16 bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
      <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4 animate-pulse">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-24 bg-gray-600 rounded"></div>
          <div className="h-4 w-8 bg-gray-600 rounded"></div>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-3 mb-2"></div>
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-gray-600 rounded"></div>
          <div className="h-3 w-12 bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>

    {/* Quick Actions Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-gray-700/50 border border-gray-600 rounded-2xl p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-8 bg-gray-600 rounded"></div>
            <div className="h-6 w-12 bg-gray-600 rounded-full"></div>
          </div>
          <div className="h-6 w-32 bg-gray-600 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-600 rounded mb-4"></div>
          <div className="h-5 w-24 bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export const AllPYQsSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-6">
      <div className="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
      <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
    </div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 animate-pulse">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-6 w-24 bg-gray-600 rounded-full"></div>
          <div className="h-6 w-20 bg-gray-600 rounded-full"></div>
        </div>
        <div className="h-4 w-full bg-gray-600 rounded mb-3"></div>
        <div className="h-4 w-3/4 bg-gray-600 rounded mb-4"></div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-gray-600 rounded"></div>
          <div className="h-4 w-12 bg-gray-600 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

export const TopicWiseSkeleton = () => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div className="h-8 w-40 bg-gray-700 rounded animate-pulse"></div>
      <div className="h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-6 w-32 bg-gray-600 rounded"></div>
            <div className="h-6 w-12 bg-gray-600 rounded-full"></div>
          </div>
          <div className="h-4 w-40 bg-gray-600 rounded mb-4"></div>
          <div className="h-5 w-24 bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export const MenuItemSkeleton = () => (
  <div className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-700/50 animate-pulse">
    <div className="h-5 w-5 bg-gray-600 rounded"></div>
    <div className="h-4 w-24 bg-gray-600 rounded"></div>
  </div>
);