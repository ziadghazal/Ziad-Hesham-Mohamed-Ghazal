import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="bg-sky-500 p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v4z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">ZIAD.AI</h1>
          <p className="text-sm text-green-400 flex items-center">
            <span className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            Online
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;