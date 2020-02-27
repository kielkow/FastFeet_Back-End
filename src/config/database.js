module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'docker',
  database: 'fastfeet',
  define: {
    timeStamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
