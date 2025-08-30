import { Link } from "react-router-dom";

export default function App() {
  return (
    <div>
      <h1>Home</h1>
      <div className="text-blue-600 font-bold">Tailwind is working ✅</div>
      <nav>
        <Link to="/adminOverview">Go to Admin Overview</Link>
      </nav>
    </div>
  );
}
