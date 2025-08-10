import React from 'react';
import { Layout } from 'antd';

// Reusable global layout wrapper to reduce duplicated spacing logic.
// Optional props:
//  - headerOffset (px): height of fixed header to offset content (default 64)
//  - padding: inner padding (default 20)
//  - maxWidth: center content with max width
//  - children: page content
//  - style: extra style overrides
//  - fluid: if true, skip maxWidth constraint
export default function AppLayout({
  headerOffset = 64,
  padding = 20,
  maxWidth = 1400,
  fluid = false,
  style = {},
  children
}) {
  return (
    <div className="app-layout-wrapper" style={{ minHeight: '100vh', display:'flex', flexDirection:'column' }}>
      <main
        className="app-layout-main"
        style={{
          flex: 1,
          padding: `${padding}px ${padding}px ${padding + 8}px`,
          // Removed top margin per user request; if overlap occurs consider adding paddingTop: headerOffset
          boxSizing: 'border-box',
          width: '100%',
          ...(fluid ? {} : { maxWidth, marginLeft: 'auto', marginRight: 'auto' }),
          ...style
        }}
      >
        {children}
      </main>
    </div>
  );
}
