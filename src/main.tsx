import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installPdfChatBridge } from "./lib/pdf-chat-bridge";

installPdfChatBridge();
createRoot(document.getElementById("root")!).render(<App />);
