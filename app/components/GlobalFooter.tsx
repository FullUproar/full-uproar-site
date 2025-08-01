'use client';

export default function GlobalFooter() {
  return (
    <footer className="bg-black text-white py-8 text-center border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-gray-400 font-semibold">
          © {new Date().getFullYear()} Full Uproar Games Inc. All rights reserved. Fugly is a registered troublemaker.
        </p>
      </div>
    </footer>
  );
}