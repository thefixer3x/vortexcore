// Debug component to test if React is working
import React from 'react';

export const DebugComponent = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('DebugComponent is rendering');
  }
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      backgroundColor: 'red', 
      color: 'white', 
      padding: '10px', 
      zIndex: 9999 
    }}>
      DEBUG: React is working!
    </div>
  );
};
