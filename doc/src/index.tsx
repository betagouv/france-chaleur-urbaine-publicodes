import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { HashRouter } from "react-router-dom"

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <React.StrictMode>
    {/* GitHub Pages does not support SPA without hacks so we use the hash router */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
