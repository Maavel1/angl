import React from "react";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import PublicSession from "./components/PublisSession/PublicSession";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter future={{ v7_startTransition: true }}>
        <Routes>
          <Route path="/" element={<PublicSession />} />
          <Route path="/adminPanel" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;