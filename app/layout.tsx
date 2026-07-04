import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Autonomous Dataset Foundry',
  description: 'A 360-degree synthetic data generation pipeline utilizing Groq models for rapid, self-questioning debate and direct-to-GitHub immutable JSONL storage.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
