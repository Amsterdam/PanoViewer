const ENVIRONMENT = (process.env.NODE_ENV).toUpperCase();


// Default Configuration
const config = {
    API_ROOT: ENVIRONMENT === 'PRODUCTION'
        ? 'https://api.data.amsterdam.nl/'
        : 'https://acc.api.data.amsterdam.nl/',
    CALLBACKS: null
};

export default config;
