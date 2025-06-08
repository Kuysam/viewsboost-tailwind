import React from 'react';

export default function CreatorSpotlight() {
  const creators = ['Creator A', 'Creator B', 'Creator C'];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Creator Spotlight</h2>
      <div className="flex gap-4 overflow-x-auto">
        {creators.map((creator, idx) => (
          <div key={idx} className="w-48 h-48 rounded-full overflow-hidden shadow-lg flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url('/images/creator-${idx + 1}.jpg')` }}>
            <div className="bg-black bg-opacity-50 h-full flex items-center justify-center">
              <p className="text-white font-semibold">{creator}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
