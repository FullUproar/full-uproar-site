'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    priceCents: '',
    imageUrl: '',
    stock: '',
  });

  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        priceCents: parseInt(form.priceCents),
        imageUrl: form.imageUrl,
        stock: parseInt(form.stock),
      }),
    });

    if (res.ok) {
      setMessage('✅ Product created!');
      setForm({
        name: '',
        slug: '',
        priceCents: '',
        imageUrl: '',
        stock: '',
      });
    } else {
      const data = await res.json();
      setMessage(`❌ Error: ${data.error || 'Failed to submit'}`);
    }
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin – Add Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {['name', 'slug', 'priceCents', 'imageUrl', 'stock'].map((field) => (
          <div key={field}>
            <label className="block mb-1 capitalize font-semibold">{field}</label>
            <input
              type="text"
              value={(form as any)[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="w-full px-4 py-2 border rounded"
              required
            />
          </div>
        ))}
        <button type="submit" className="bg-black text-white px-6 py-2 rounded font-bold">
          Add Product
        </button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
