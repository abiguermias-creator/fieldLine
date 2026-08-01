import { useEffect, useState } from "react";
import { checkHealth } from "./api/health";

function App() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setStatus(JSON.stringify(data));
      })
      .catch((error) => {
        setStatus(error.message);
      });
  }, []);

  return (
    <div>
      <h1>FieldLine</h1>

      <p>
        API Status:
      </p>

      <pre>
        {status}
      </pre>
    </div>
  );
}

export default App;
