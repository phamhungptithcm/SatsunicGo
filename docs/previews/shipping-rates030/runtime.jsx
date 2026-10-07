// Isolated rendered test fixture; production entry points never import this file.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ShippingRates } from '/src/features/shipping/ShippingRates.tsx';
const root = createRoot(document.getElementById('root'));
window.__shippingFixture.render = (staff = false) => {
  root.render(<React.StrictMode><BrowserRouter><ShippingRates key={++window.__shippingFixture.sequence} staff={staff} /></BrowserRouter></React.StrictMode>);
};
window.__shippingFixture.render();
