import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/userSlice'; // Importă acțiunea logout
import { useNavigate } from 'react-router-dom';

const LogoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Resetează starea în Redux
    dispatch(logout());

    // Șterge datele din localStorage
    localStorage.removeItem('user');

    // Redirecționează utilizatorul către pagina de login
    navigate('/login');
  };

  return (
    <div>
      <h1>Logout</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default LogoutPage;