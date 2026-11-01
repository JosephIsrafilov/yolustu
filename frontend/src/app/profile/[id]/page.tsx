import DemoClient from './DemoClient';
import { Suspense } from 'react';
export async function generateStaticParams() { return ['passenger', 'driver', 'driver2', 'admin', 'demo'].map((id) => ({ id })); }
export default function Page() { return <Suspense fallback={null}><DemoClient /></Suspense>; }
