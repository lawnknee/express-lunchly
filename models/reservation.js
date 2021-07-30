"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

const { BadRequestError } = require("../expressError");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** gets and sets numGuests. Throws error if numGuests is 0 or less */

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(val) {
    if (val < 1) throw new BadRequestError();
    this._numGuests = val;
  }

  /** gets and sets startAt date. Throws error if startAt date is invalid */

  get startAt() {
    return this._startAt;
  }

  set startAt(date) {
    if (isNaN(date.getDate())) throw new BadRequestError();
    this._startAt = date;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  /** get a reservation by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE id = $1`,
      [id]
    );

    const reservation = results.rows[0];

    if (reservation === undefined) {
      const err = new Error(`No such reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(reservation);
  }

  /** save this reservation */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
            SET start_at=$1,
                num_guests=$2,
                notes=$3
            WHERE id = $4`,
        [this.startAt, this.numGuests, this.notes, this.id]
      );
    }
  }
}

module.exports = Reservation;
