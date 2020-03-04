// import * as Yup from 'yup';
import { Op } from 'sequelize';

import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Courier from '../models/Courier';
// import File from '../models/File';

class CourierController {
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
        limit: 8,
        offset: (page - 1) * 8,
      });
      return res.json(orders);
    }

    const orders = await Order.findAll({
      order: ['id'],
      limit: 8,
      offset: (page - 1) * 8,
    });
    return res.json(orders);
  }

  // async store(req, res) {}

  // async update(req, res) {}

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id);

    try {
      await order.destroy();
      return res.json({ succes: 'Order deleted' });
    } catch (error) {
      return res.json(error);
    }
  }
}

export default new CourierController();
