import React, { useState } from "react";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import PublicSession from "./components/PublisSession/PublicSession";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div>
      <button onClick={() => setIsAdmin(!isAdmin)}>
        {isAdmin ? "Switch to Public" : "Switch to Admin"}
      </button>
      {isAdmin ? <AdminPanel /> : <PublicSession />}
    </div>
  );
}

export default App;
