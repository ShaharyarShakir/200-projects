import { useState } from "react";

import "./App.css";
import { useEffect } from "react";

function App() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("http://localhost:3000/api/message")
      .then((res) => res.json())
      .then(({ message }) => setMessage(message))
      .catch((error) => console.error("Error fetching message:", error));
  }, []);

  return (
    <>
      <h1>Welcome to the Full Stack App</h1>
      <h2>data: {message}</h2>
    </>
  );
}

export default App;
