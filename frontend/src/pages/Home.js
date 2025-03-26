import React, { useEffect, useState } from 'react';

const Home = () => {
  const [message, setMessage] = useState('Loading...'); // Default message while loading
  const [data, setData] = useState(null); // Database data
  const [isMessageLoading, setIsMessageLoading] = useState(true); // Loading state for the message
  const [isDataLoading, setIsDataLoading] = useState(true); // Loading state for database

  useEffect(() => {
    // Fetch data from the backend
    fetch('http://localhost:5000/') // Replace with your backend URL
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message || 'Hello from Flask!');
        setData(data.data || null);
        setIsMessageLoading(false); // Stop loading for the message
        setIsDataLoading(false); // Stop loading for the database
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setMessage('Error fetching data from the backend.');
        setIsMessageLoading(false);
        setIsDataLoading(false);
      });
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      {/* Main Template Sign */}
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>Flask + React</h1>

      {/* Smaller Message */}
      <h2 style={{ fontSize: '1.5rem', color: '#555' }}>
        {isMessageLoading ? 'Loading...' : message}
      </h2>

      {/* Database Entry */}
      <div style={{ marginTop: '20px', fontSize: '1.2rem', color: '#333' }}>
        {isDataLoading ? (
          <p>Loading database entry...</p> // Show loading message while fetching database data
        ) : data ? (
          <p>
            Database Entry: <strong>{data.id}</strong> - {data.value}
          </p>
        ) : (
          <p>No data found in the database.</p> // Show this if no data is available
        )}
      </div>
    </div>
  );
};

export default Home;