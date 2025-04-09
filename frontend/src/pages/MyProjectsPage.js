import React from 'react';
import ProjectListPage from '../components/ProjectListPage';

const MyProjectsPage = () => {
  return <ProjectListPage defaultRoleFilter="owner" showFilterDropdown={false} />;
};

export default MyProjectsPage;