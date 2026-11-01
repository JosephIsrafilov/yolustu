import DemoClient from './DemoClient';
import { Suspense } from 'react';
export async function generateStaticParams() { return ['ride-baku-ganja', 'ride-baku-quba', 'ride-ganja-baku', 'ride-baku-sheki', 'ride-past', 'demo'].map((id) => ({ id })); }
export default function Page() { return <Suspense fallback={null}><DemoClient /></Suspense>; }
