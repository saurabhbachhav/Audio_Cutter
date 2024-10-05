// src/app/layout.tsx

import { MantineProvider } from '@mantine/core';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MantineProvider withGlobalStyles withNormalizeCSS>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
