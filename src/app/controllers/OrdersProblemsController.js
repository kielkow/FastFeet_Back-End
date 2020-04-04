import * as Yup from 'yup';

import Order from '../models/Order';
import OrdersProblems from '../models/OrdersProblems';

class OrdersProblemsController {
  async index(req, res) {
    const { page = 1 } = req.query;

    if (req.params.id) {
      const ordersWithProblems = await OrdersProblems.findAll({
        where: {
          order_id: req.params.id,
        },
        order: ['id'],
        include: [
          {
            model: Order,
            as: 'order',
            attributes: [
              'recipient_id',
              'courier_id',
              'signature_id',
              'product',
              'start_date',
              'end_date',
              'canceled_at',
            ],
          },
        ],
        limit: 8,
        offset: (page - 1) * 8,
      });

      const ordersNotCanceled = ordersWithProblems.filter(orderWithProblem => {
        return orderWithProblem.order.canceled_at === null;
      });

      return res.json(ordersNotCanceled);
    }

    const ordersWithProblems = await OrdersProblems.findAll({
      order: ['id'],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: [
            'recipient_id',
            'courier_id',
            'signature_id',
            'product',
            'start_date',
            'end_date',
            'canceled_at',
          ],
        },
      ],
      limit: 8,
      offset: (page - 1) * 8,
    });

    const ordersNotCanceled = ordersWithProblems.filter(orderWithProblem => {
      return orderWithProblem.order.canceled_at === null;
    });

    return res.json(ordersNotCanceled);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      order_id: Yup.number().required(),
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // check if order exist
    const checkOrderExist = await Order.findOne({
      where: { id: req.body.order_id, canceled_at: null },
    });

    if (!checkOrderExist)
      return res.status(400).json({ error: 'Order not exist or is canceled' });

    // check if order problem already exist
    const checkOrdersProblemsExist = await OrdersProblems.findOne({
      where: { id: req.body.order_id, description: req.body.description },
    });

    if (checkOrdersProblemsExist)
      return res.status(400).json({ error: 'Order Problem already exist' });

    const { id, order_id, description } = await OrdersProblems.create(req.body);

    return res.json({
      id,
      order_id,
      description,
    });
  }
}

export default new OrdersProblemsController();
