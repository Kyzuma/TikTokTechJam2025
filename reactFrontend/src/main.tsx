import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AdminOverview from "./screens/adminOverview";
import FlaggedTransactions from "./screens/flaggedTransactions";
import UsersData from "./screens/usersData";
import Logs from "./screens/logs";

// Import the single global stylesheet that has @import "tailwindcss"
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/adminOverview" element={<AdminOverview />} />
        <Route path="/flaggedTransactions" element={<FlaggedTransactions />} />
        <Route path="/usersData" element={<UsersData />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
