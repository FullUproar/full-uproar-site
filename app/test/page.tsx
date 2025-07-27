export default function TestPage() {
  return (
    <div style={{ background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#f97316', marginBottom: '1rem' }}>FUGLY TEST PAGE</h1>
      <p style={{ color: '#fdba74', fontSize: '1.25rem', fontWeight: 'bold' }}>This uses inline styles to test if the issue is Tailwind</p>
      <div style={{ background: '#f97316', color: '#111827', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem', fontWeight: 900 }}>
        This should be an orange box with dark text
      </div>
      <div className="bg-red-500 p-4 mt-4">
        This uses Tailwind classes - if you see red, Tailwind is working
      </div>
      <div style={{ background: 'red', padding: '1rem', marginTop: '1rem' }}>
        This uses inline red - should always work
      </div>
    </div>
  );
}