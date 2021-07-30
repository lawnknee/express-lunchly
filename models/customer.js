"use strict";

/** Customer for Lunchly */

const db = require("../db");
const { BadRequestError } = require("../expressError");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this._phone = phone;
    this.notes = notes;
  }

/** gets and sets customer phone number. Throws error if phone number is 
 * less than 10 digits
 */

  get phone() {
    return this._phone;
  }

  set phone(numStr) {
    if (numStr.length > 0 && numStr.length < 10) throw new BadRequestError();
    this._phone = numStr;
  }
  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer to database. */

  async save() {
    
    if (this.id === undefined) {
      this.phone = this._phone;
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }

  /** searches for a customer like the given searchName */

  static async search(searchName) {
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
       FROM customers
       WHERE first_name ILIKE $1 OR last_name ILIKE $1
       ORDER BY last_name, first_name`,
       ['%' + searchName + '%']
    );

    return results.rows.map(c => new Customer(c));
  }

  /** find top 10 customers based on num of reservations
   *  ordered by num, then first name. */

  static async top() {
    const results = await db.query(
          `SELECT c.id,
                  c.first_name AS "firstName",
                  c.last_name  AS "lastName",
                  c.phone,
                  c.notes
           FROM customers as c
              JOIN reservations
                  ON c.id = customer_id
           GROUP BY c.id 
           ORDER BY count(c.id) DESC, c.first_name
           LIMIT 10`,
    );
    return results.rows.map(c => new Customer(c));
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;
