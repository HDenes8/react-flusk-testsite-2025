import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import MainPage from './pages/MainPage';
import MyProjectsPage from './pages/MyProjectsPage';
import Invitations from './pages/Invitations';
import CreateProject from './pages/CreateProject';
import Settings from './pages/Settings';
import ProjectsPage from './pages/ProjectsPage';
import './App.css';
import MembersPage from './pages/MembersPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={
          <Layout>
            <LoginPage />
          </Layout>
        } />
        <Route path="/MainPage" element={
          <Layout>
            <MainPage />
          </Layout>
        } />
        <Route path="/MyProjectsPage" element={
          <Layout>
            <MyProjectsPage />
          </Layout>
        } />
        <Route path="/invitations" element={
          <Layout>
            <Invitations />
          </Layout>
        } />
        <Route path="/create-project" element={
          <Layout>
            <CreateProject />
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />
        <Route path="/ProjectsPage/:project_id" element={
          <Layout>
            <ProjectsPage />
          </Layout>
        } />
        <Route path="/MembersPage" element={
          <Layout>
            <MembersPage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
