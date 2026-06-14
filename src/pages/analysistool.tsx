import React from 'react';

// FIX: Added sandbox and referrerPolicy attributes to the iframe.
// Without sandbox, the embedded third-party site (api.binarytool.site) could
// navigate the top-level frame, execute scripts in the parent context, or
// submit forms — a significant XSS risk if that domain is ever compromised.
const Analysistool = () => (
    <iframe
        src='https://api.binarytool.site'
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title='Analysis Tool'
        sandbox='allow-scripts allow-same-origin allow-forms allow-popups'
        referrerPolicy='no-referrer'
    />
);

export default Analysistool;
