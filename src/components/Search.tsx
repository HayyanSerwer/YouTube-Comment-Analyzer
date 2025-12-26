import { useState } from 'react';

interface SearchProps {
  onURLChange: (url: string) => void; 
}

export default function Search({ onURLChange }: SearchProps) {
  const [inputValue, setInputValue] = useState(""); 

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value); 
    onURLChange(event.target.value);
  };

  return (
    <input
      type="text"
      value={inputValue} 
      onChange={handleInputChange} 
      placeholder="Enter YouTube link"
      className="
        w-full
        rounded-2xl
        border border-gray-300
        bg-white
        px-6 py-4
        text-lg
        text-gray-800
        placeholder-gray-400
        shadow-md
        focus:border-red-500
        focus:ring-4 focus:ring-red-200
        focus:outline-none
        transition
      "
    />
  );
}
