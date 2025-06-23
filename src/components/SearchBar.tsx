export default function SearchBar() {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Search videos..."
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-full border border-gray-600 focus:border-yellow-400 focus:outline-none"
        />
        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400">
          🔍
        </button>
      </div>
    </div>
  );
}