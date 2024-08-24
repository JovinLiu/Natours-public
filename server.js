//Backend starting point
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!, Shutting Down.......');
  console.log(err.name, err.message);
  process.exit(1);
});

//load 环境变量 config file，这步要发生在app之前，否者app就无法访问环境变量了
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    // console.log(con.connections);
    console.log('MongoDB connection successfully');
  });

//4 Run backend
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on ${port}...`);
});

//5 Handle Error outside Express

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED EXCEPTION!, Shutting Down.......');
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});

// process.on('SIGTERM', () => {
//   server.close(() => {
//     console.log('Process terminated with SIGTERM');
//   });
// });
