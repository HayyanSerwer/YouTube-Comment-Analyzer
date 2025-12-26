import { useState } from 'react'
import {Route, Routes} from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import Home from './components/Home'
import About from './components/About'
import Analyzer from './components/Analyzer'
import Saves from './components/Saves'

function App() {
  const [count, setCount] = useState(0)

  const [URL, setURL] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-800 to-stone-900">
      <Navbar />
      <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                URL={URL}
                setURL={setURL}
                comments={comments}
                setComments={setComments}
                loading={loading}
                setLoading={setLoading}
              />
            } 
          />
          <Route path="/about" element={<About />} />
          <Route path="/AI Analyzer" element={<Analyzer comments={comments} URL={URL} />} />
          <Route path="/Saves" element={<Saves comments={comments} URL={URL} />} />

      </Routes>
    </div>
  )
}

export default App