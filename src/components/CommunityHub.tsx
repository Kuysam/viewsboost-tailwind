// CommunityHub component

export default function CommunityHub() {
  const posts = ['Poll: Favorite Genre?', 'Clip: Amazing Trick'];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Community Hub</h2>
      <div className="space-y-4">
        {posts.map((post, idx) => (
          <div key={idx} className="w-full p-4 bg-zinc-800 rounded-lg shadow-lg">
            <p className="text-white">{post}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
