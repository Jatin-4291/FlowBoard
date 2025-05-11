import Home from "./Pages/Home";
import WhiteBoard from "./Pages/WhiteBoard";
import NotFound from "./Pages/NotFound";
import { Route, Routes } from "react-router-dom";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/whiteboard" element={<WhiteBoard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
