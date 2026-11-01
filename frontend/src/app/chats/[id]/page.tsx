import DemoClient from './DemoClient';
import { Suspense } from 'react';
export async function generateStaticParams() { return [{ id: 'demo' }]; }
export default function Page() { return <Suspense fallback={null}><DemoClient /></Suspense>; }
