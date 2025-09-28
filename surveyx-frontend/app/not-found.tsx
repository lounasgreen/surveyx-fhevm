import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="mb-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          
          <Link
            href="javascript:history.back()"
            className="btn-secondary flex items-center justify-center gap-2 w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please check the URL or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
