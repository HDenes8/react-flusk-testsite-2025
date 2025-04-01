import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import Projects from './pages/projects';
import Invitations from './pages/Invitations';
import Settings from './pages/Settings';
import CreateProject from './pages/CreateProject';
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
        <Route path="/projects" element={
          <Layout>
            <Projects />
          </Layout>
        } />
        <Route path="/invitations" element={
          <Layout>
            <Invitations />
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />
        <Route path="/create-project" element={
          <Layout>
            <CreateProject />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
