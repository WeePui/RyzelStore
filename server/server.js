const app = require('./app');
const connectDatabase = require('./config/database');

const dotenv = require('dotenv');

// Set up file config
dotenv.config({ path: 'config/config.env' });

// Connect to DB
connectDatabase();

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`
  );
});

// Handle Uncalled exceptions
process.on('uncaughtException', (error) => {
  console.log(`ERROR: ${error.stack}`);
  console.log(`SHUTTING DOWN THE SERVER DUE TO UNCAUGHT EXCEPTION`);
  process.exit(1);
});

// Hanlde Unhandled Promise Rejection
process.on('unhandledRejection', (err) => {
  console.log(`ERROR: ${err.stack}`);
  console.log(`SHUTTING DOWN THE SERVER DUE TO UNHANDLED PROMISE REJECTION`);
  server.close(() => process.exit(1));
});
