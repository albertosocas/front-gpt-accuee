import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center mt-10">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Home Page</h1>
      <Link to="/login" className="text-blue-500">Go to Login</Link>
      <br />
      <Link to="/register" className="text-green-500">Go to Register</Link>
    </div>
  );
};

export default Home;