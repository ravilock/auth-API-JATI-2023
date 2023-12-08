/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('users', function(table) {
      table.increments('id');
      table.string('username', 255).index().notNullable().unique();
      table.string('email', 256).notNullable().unique();
      table.string('password', 60).notNullable();
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('users')
};
