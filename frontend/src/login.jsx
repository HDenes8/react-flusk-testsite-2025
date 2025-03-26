import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="container mx-auto max-w-md p-6">
      <form method="POST" className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="logo text-center mb-4">
          <img src="/static/sortify_logo.png" alt="Sortify Logo" width="250" />
        </div>
        <h3 className="text-center text-xl font-semibold mb-4">Log In</h3>
        
        <div className="form-group mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
          <input 
            type="email" 
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            id="email" 
            name="email" 
            placeholder="Enter email" 
          />
        </div>

        <div className="form-group mb-4">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input 
            type="password" 
            className="form-control shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            id="password" 
            name="password" 
            placeholder="Enter password" 
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Log In
        </button>

        <div className="divider text-center my-4 text-gray-500">----------------------------------or----------------------------------</div>

        <Link to="/sign-up" className="btn btn-secondary bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-full text-center">
          Register
        </Link>
      </form>
    </div>
  );
};

export default Login;
