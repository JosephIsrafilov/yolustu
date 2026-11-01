import DemoClient from './DemoClient';
import { Suspense } from 'react';
export async function generateStaticParams() { return ['demo-ride-baku-ganja', 'demo-ride-baku-quba', 'demo-ride-ganja-baku', 'demo-ride-baku-sheki', 'demo-ride-past', 'demo'].map((shareToken) => ({ shareToken })); }
export default function Page({ params }: { params: Promise<{ shareToken: string }> }) { return <Suspense fallback={null}><DemoClient params={params} /></Suspense>; }
