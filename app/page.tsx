import { Suspense } from "react";
import HomeWithGate from "./components/HomeWithGate";

export default function Home() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a' }} />}>
      <HomeWithGate />
    </Suspense>
  );
}
