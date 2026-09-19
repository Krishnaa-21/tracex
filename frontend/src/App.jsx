import React from "react";
import AppRouter from "./routes/AppRouter";
import { ModeProvider } from "./context/ModeContext";

export default function App() {
  return (
    <ModeProvider>
      <AppRouter />
    </ModeProvider>
  );
}
