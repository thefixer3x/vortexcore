// Debug component to test if React is working


export const DebugComponent = () => {
  if (import.meta.env.DEV) {
    console.log('DebugComponent is rendering');
  }
  return (
    <div className="debug-component">
      DEBUG: React is working!
    </div>
  );
};
