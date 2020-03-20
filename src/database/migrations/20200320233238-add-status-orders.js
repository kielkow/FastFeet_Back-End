module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('orders', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'withdrawn',
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
      allowNull: false,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('orders', 'status');
  },
};
