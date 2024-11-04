import { NavBar } from "./features/navbar/NavBar"
import { Content } from "./features/content/Content"
import { TimeoutWarning } from "./features/navbar/TimeoutWarning"

const App = () => {
  return (
    <div className="app">
      <NavBar />
      <Content />
      <TimeoutWarning />
    </div>
  )
}

export default App