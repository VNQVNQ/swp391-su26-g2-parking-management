import "./hung_index.css"
import "./hung_style.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
