import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { register } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const action = await dispatch(register({ email, password }));
      if (register.fulfilled.match(action)) {
        navigate('/home');
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault(); // Prevenim comportamentul implicit
    navigate('/login');
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{' '}
          <button
            onClick={handleLoginClick}
            className="text-blue-500 hover:text-blue-700 font-semibold"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;