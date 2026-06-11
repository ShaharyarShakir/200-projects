import { MyPlayer } from "./VideoPlayer";


function App() {

  const videoLink = "http://localhost:8000/uploads/courses/fe394d5c-574a-474e-8acf-a62b5216d7f3/index.m3u8"
return (
    <div>
      <h1>Video Streaming App</h1>
      <MyPlayer src={videoLink}/>
    </div>
  );
}

export default App