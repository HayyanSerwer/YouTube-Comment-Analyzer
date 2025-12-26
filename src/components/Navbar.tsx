import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const navItems = [
    { name: 'Comments' },
    { name: 'AI Analyzer' },
    { name: 'Saves' },
    { name: 'About' }
  ];

  return (
    <nav>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center h-16 space-x-2 relative">
          {navItems.map((item, index) => (
            <Link to={item.name === "Comments" ? "/" : `/${item.name}`}>
            <div
              key={item.name}
              className={`relative ${index === 0 ? 'order-last' : ''}`}
              onMouseEnter={() => setActiveItem(item.name)}
              onMouseLeave={() => setActiveItem(null)}
            >
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                  activeItem === item.name
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/80 hover:bg-white/20 hover:text-white hover:shadow-lg'
                }`}
              >
                {item.name}
              </button>
            </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}