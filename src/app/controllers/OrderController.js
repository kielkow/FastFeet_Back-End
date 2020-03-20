import * as Yup from 'yup';
import { Op } from 'sequelize';

import {
  startOfHour,
  startOfDay,
  endOfDay,
  parseISO,
  getHours,
  isBefore,
} from 'date-fns';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Courier from '../models/Courier';
import File from '../models/File';

import CancellationMail from '../jobs/CancellationMail';
import CreateMail from '../jobs/CreateMail';
import FinishMail from '../jobs/FinishMail';
import Queue from '../../lib/Queue';

class OrderController {
  async index(req, res) {
    const { page = 1 } = req.query;

    if (req.query.product) {
      const orders = await Order.findAll({
        where: {
          product: {
            [Op.iRegexp]: req.query.product,
          },
        },
        order: ['id'],
        include: [
          {
            model: Recipient,
            as: 'recipient',
            attributes: [
              'name',
              'signature_id',
              'street',
              'number',
              'details',
              'state',
              'city',
              'cep',
            ],
          },
          {
            model: Courier,
            as: 'courier',
            attributes: ['name', 'avatar_id', 'email'],
          },
        ],
        limit: 6,
        offset: (page - 1) * 8,
      });
      return res.json(orders);
    }

    const orders = await Order.findAll({
      order: ['id'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'signature_id',
            'street',
            'number',
            'details',
            'state',
            'city',
            'cep',
          ],
        },
        {
          model: Courier,
          as: 'courier',
          attributes: ['name', 'avatar_id', 'email'],
        },
      ],
      limit: 6,
      offset: (page - 1) * 8,
    });
    return res.json(orders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      courier_id: Yup.number().required(),
      signature_id: Yup.number().required(),
      product: Yup.string().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // check if order already exist
    const orderExists = await Order.findOne({
      where: {
        recipient_id: req.body.recipient_id,
        courier_id: req.body.courier_id,
        product: req.body.product,
      },
    });

    if (orderExists) {
      return res.status(400).json({ error: 'Order already exist' });
    }

    // check if recipient exist
    const recipientExists = await Recipient.findOne({
      where: { id: req.body.recipient_id },
    });

    if (!recipientExists) {
      return res.status(400).json({ error: 'Recipient not exist' });
    }

    // check if courier exist
    const courierExists = await Courier.findOne({
      where: { id: req.body.courier_id },
    });

    if (!courierExists) {
      return res.status(400).json({ error: 'Courier not exist' });
    }

    // check if file exist
    const fileExists = await File.findOne({
      where: { id: req.body.signature_id },
    });

    if (!fileExists) {
      return res.status(400).json({ error: 'File not exist' });
    }

    // check if hour is between 08:00 and 18:00
    const hourStart = getHours(startOfHour(parseISO(req.body.start_date)));

    if (hourStart < 8 || hourStart > 18) {
      return res.status(400).json({ error: 'Past date are not permitted' });
    }

    // check number of open orders today
    const today = parseISO(req.body.start_date);

    const similiarOrders = await Order.findAndCountAll({
      where: {
        start_date: {
          [Op.between]: [startOfDay(today), endOfDay(today)],
        },
      },
    });

    if (similiarOrders.count >= 5)
      return res
        .status(400)
        .json({ error: 'Not possible open more than 5 orders p/ day' });

    const order = await Order.create(req.body);

    await Queue.add(CreateMail.key, {
      order,
      courierExists,
      recipientExists,
    });

    return res.json(order);
  }

  async update(req, res) {
    try {
      const order = await Order.findByPk(req.params.id, {
        include: [
          {
            model: Recipient,
            as: 'recipient',
            attributes: [
              'name',
              'signature_id',
              'street',
              'number',
              'details',
              'state',
              'city',
              'cep',
            ],
          },
          {
            model: Courier,
            as: 'courier',
            attributes: ['id', 'name', 'avatar_id', 'email'],
          },
        ],
      });

      if (!order) return res.json({ error: 'Order not found' });

      if (!req.userId) {
        return res.status(401).json({
          error: "You don't have permission to update this appointment",
        });
      }

      order.end_date = new Date();

      if (isBefore(order.end_date, order.start_date))
        return res.json({ error: 'Date not permitted' });

      await order.save();

      await Queue.add(FinishMail.key, {
        order,
      });

      return res.json(order);
    } catch (error) {
      return res.json(error);
    }
  }

  async delete(req, res) {
    try {
      const order = await Order.findByPk(req.params.id, {
        include: [
          {
            model: Recipient,
            as: 'recipient',
            attributes: [
              'name',
              'signature_id',
              'street',
              'number',
              'details',
              'state',
              'city',
              'cep',
            ],
          },
          {
            model: Courier,
            as: 'courier',
            attributes: ['name', 'avatar_id', 'email'],
          },
        ],
      });

      if (!order) return res.json({ error: 'Order not found' });

      if (!req.userId) {
        return res.status(401).json({
          error: "You don't have permission to cancel this appointment",
        });
      }

      order.canceled_at = new Date();

      await order.save();

      await Queue.add(CancellationMail.key, {
        order,
      });

      return res.json(order);
    } catch (error) {
      return res.json(error);
    }
  }
}

export default new OrderController();
