// Custom E-Commerce Site Boilerplate for Full Uproar
// Tech: Next.js + TailwindCSS + Snipcart

// 1. Pages: Home, Product, About (optional), Contact (optional)
// 2. Sections: Hero, Product Grid, Reviews, Newsletter Signup, Footer
// 3. Snipcart integration for simple, secure cart/checkout

export default function Home() {
  return (
    <main className="bg-black text-white font-sans">

      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold">FULL UPROAR</h1>
        <div>
          <button className="snipcart-checkout text-neon-green">🛒 Cart</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h2 className="text-5xl mb-6 font-extrabold leading-tight">
          MEET THE MASCOT.<br />
          GAMES COMING SOON.
        </h2>
        <p className="mb-6 text-lg text-gray-300 max-w-xl mx-auto">
          He's chaotic, he's merch-ready, and he's only getting started. Grab his gear while the games are still brewing.
        </p>
        <div className="space-x-4">
          <a href="#shop" className="bg-white text-black px-6 py-3 rounded-xl shadow font-bold">Shop Mascot Merch</a>
          <a href="#newsletter" className="border border-white px-6 py-3 rounded-xl font-bold">Follow the Chaos</a>
        </div>
      </section>

      {/* Product Grid */}
      <section id="shop" className="py-16 px-6">
        <h3 className="text-4xl text-center mb-10 font-bold">SHOP MASCOT MERCH</h3>
        <div className="bg-gray-100 p-6 rounded-xl text-center shadow-md max-w-sm mx-auto">
          <div className="w-full h-64 relative overflow-hidden mb-4">
            <img
              src="/fugly_shirt.jpg"
              alt="Fugly Mascot Tee"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
          <h4 className="text-2xl font-bold mb-2">Fugly Mascot Tee</h4>
          <p className="mb-2">$20.00</p>
          <button className="bg-black text-white px-4 py-2 rounded font-bold">
            Add to Cart
          </button>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-neon-pink text-black py-16 px-6 text-center">
        <h3 className="text-3xl mb-10 font-bold">WHAT PEOPLE AREN'T SAYING YET</h3>
        <p className="mb-4 italic">“I bought a sticker. Now he watches me while I sleep.” – Totally Real Fan</p>
        <p className="mb-4 italic">“Why is this little guy funnier than me?” – Anonymous Probably</p>
        <p className="mb-4 italic">“10/10 would impulse buy again.” – My Wallet</p>
      </section>

      {/* Newsletter Signup */}
      <section id="newsletter" className="bg-black text-white py-16 px-6 text-center">
        <h3 className="text-3xl font-bold mb-4">JOIN THE CHAOS CULT</h3>
        <p className="mb-6 text-gray-300">Early game updates, secret drops, and questionable decisions straight to your inbox.</p>
        <form className="flex justify-center gap-4 max-w-md mx-auto">
          <input type="email" placeholder="you@chaosmail.com" className="px-4 py-2 rounded w-full text-black" />
          <button className="bg-white text-black px-6 py-2 rounded font-bold">I’M IN</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-white text-black py-6 px-6 flex flex-col md:flex-row justify-between items-center">
        <div className="text-xl font-bold">FULL UPROAR</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#">Instagram</a>
          <a href="#">Contact</a>
          <a href="#">Privacy</a>
        </div>
      </footer>

      {/* Snipcart Script
      <script async src="https://cdn.snipcart.com/themes/v3.3.3/default/snipcart.js"></script>
      <div hidden id="snipcart" data-api-key="YOUR_PUBLIC_API_KEY"></div> */}
    </main>
  );
}
