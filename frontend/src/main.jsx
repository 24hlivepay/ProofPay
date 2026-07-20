import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App";

import { EscrowProvider } from "./context/EscrowContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

    <EscrowProvider>

      <BrowserRouter>

        <App />

      </BrowserRouter>

    </EscrowProvider>

  </React.StrictMode>
);