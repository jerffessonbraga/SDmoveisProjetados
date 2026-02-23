import React from "react";

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background">
    <main className="p-6">{children}</main>
  </div>
);
