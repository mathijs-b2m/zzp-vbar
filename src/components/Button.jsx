// src/components/Button.jsx

import React from 'react';
import { cva } from 'class-variance-authority';

// We use class-variance-authority (optional) for styling variants
// But to keep things very simple, let's just define a single style.
// If you want to skip cva, you can just define a normal className string.

const buttonStyles = cva(
  "inline-flex items-center px-4 py-2 text-sm font-medium \
   transition-colors focus:outline-none \
   focus:ring-2 focus:ring-offset-2 focus:ring-ring \
   disabled:opacity-50 disabled:pointer-events-none \
   bg-blue-600 text-white hover:bg-blue-700"
);

// Here's our Button component
export function Button({ children, ...props }) {
  return (
    <button className={buttonStyles()} {...props}>
      {children}
    </button>
  );
}
