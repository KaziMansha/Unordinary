import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import HomePage from './components/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthForm />} />
      <Route path="/home" element={<HomePage />} />
    </Routes>
  );
}

export default App;
