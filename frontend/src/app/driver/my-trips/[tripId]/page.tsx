import DemoClient from './DemoClient';
import { Suspense } from 'react';
export async function generateStaticParams() { return ['ride-baku-ganja', 'ride-baku-quba', 'ride-ganja-baku', 'ride-baku-sheki', 'ride-past', 'demo'].map((tripId) => ({ tripId })); }
export default function Page({ params }: { params: Promise<{ tripId: string }> }) { return <Suspense fallback={null}><DemoClient params={params} /></Suspense>; }
