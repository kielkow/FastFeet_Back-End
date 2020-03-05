import * as Yup from 'yup';
import { Op } from 'sequelize';

import { startOfHour, parseISO, format, getHours, isBefore } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Courier from '../models/Courier';
import File from '../models/File';

import Mail from '../../lib/Mail';

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

    const recipientExists = await Recipient.findOne({
      where: { id: req.body.recipient_id },
    });

    if (!recipientExists) {
      return res.status(400).json({ error: 'Recipient not exist' });
    }

    const courierExists = await Courier.findOne({
      where: { id: req.body.courier_id },
    });

    if (!courierExists) {
      return res.status(400).json({ error: 'Courier not exist' });
    }

    const fileExists = await File.findOne({
      where: { id: req.body.signature_id },
    });

    if (!fileExists) {
      return res.status(400).json({ error: 'File not exist' });
    }

    const hourStart = getHours(startOfHour(parseISO(req.body.start_date)));

    if (hourStart < 8 || hourStart > 18) {
      return res.status(400).json({ error: 'Past date are not permitted' });
    }

    const order = await Order.create(req.body);

    await Mail.sendMail({
      to: `${courierExists.name} <${courierExists.email}>`,
      subject: 'Encomenda disponível para retirada',
      template: 'confirmation',
      context: {
        courier: courierExists.name,
        recipient: recipientExists.name,
        date: format(order.start_date, "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
        street: recipientExists.street,
        number: recipientExists.number,
        details: recipientExists.details,
        state: recipientExists.state,
        city: recipientExists.city,
        cep: recipientExists.cep,
      },
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

      await Mail.sendMail({
        to: `${order.courier.name} <${order.courier.email}>`,
        subject: 'Data final de envio confirmada',
        template: 'enddate',
        context: {
          courier: order.courier.name,
          courierId: order.courier.id,
          recipient: order.recipient.name,
          start_date: format(
            order.start_date,
            "'dia' dd 'de' MMMM', às' H:mm'h'",
            {
              locale: pt,
            }
          ),
          end_date: format(order.end_date, "'dia' dd 'de' MMMM', às' H:mm'h'", {
            locale: pt,
          }),
          street: order.recipient.street,
          number: order.recipient.number,
          details: order.recipient.details,
          state: order.recipient.state,
          city: order.recipient.city,
          cep: order.recipient.cep,
        },
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

      await Mail.sendMail({
        to: `${order.courier.name} <${order.courier.email}>`,
        subject: 'Encomenda cancelada',
        template: 'cancellation',
        context: {
          courier: order.courier.name,
          recipient: order.recipient.name,
          date: format(order.start_date, "'dia' dd 'de' MMMM', às' H:mm'h'", {
            locale: pt,
          }),
        },
      });

      return res.json(order);
    } catch (error) {
      return res.json(error);
    }
  }
}

export default new OrderController();
