import React from 'react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // This component will be enhanced with actual auth check
  return <>{children}</>;
};

export default ProtectedRoute;
