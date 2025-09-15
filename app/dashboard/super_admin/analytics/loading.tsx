export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex flex-col items-center space-y-4 animate-fadeIn">
        {/* Modern Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-t-blue-500 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-4 border-t-transparent border-blue-500 rounded-full animate-spin-slow"></div>
        </div>
        {/* Loading Text */}
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200 animate-pulse">
          Loading products...
        </p>
      </div>
    </div>
  );
}