import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <Layout>
            <MainPage />
          </Layout>
        } />
        <Route path="/mainpage" element={
          <Layout>
            <ProjectsPage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
