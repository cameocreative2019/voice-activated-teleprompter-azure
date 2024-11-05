import { useEffect } from "react"
import { NavBar } from "./features/navbar/NavBar"
import { Content } from "./features/content/Content"
import { TimeoutWarning } from "./features/navbar/TimeoutWarning"
import { tokenManager } from "./features/token/tokenManager"

const App = () => {
  useEffect(() => {
    // Initialize token manager when app starts
    tokenManager.initialize().catch(error => {
      console.error('Failed to initialize token manager:', error);
    });

    // Cleanup when app unmounts
    return () => {
      tokenManager.cleanup();
    };
  }, []);

  return (
    <div className="app">
      <NavBar />
      <Content />
      <TimeoutWarning />
    </div>
  );
};

export default App;