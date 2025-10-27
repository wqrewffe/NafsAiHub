import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="hero-bg" aria-hidden="true">
      <div className="hero-bg__layer hero-bg__layer--1"></div>
      <div className="hero-bg__layer hero-bg__layer--2"></div>
      <div className="hero-bg__layer hero-bg__layer--3"></div>
      <div className="hero-bg__overlay"></div>
    </div>
  );
};

export default AnimatedBackground;