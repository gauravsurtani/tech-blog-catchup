import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Tech Blog Catchup
          </p>
          <nav className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Privacy
            </Link>
            <a
              href="https://github.com/gauravsurtani/tech-blog-catchup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
