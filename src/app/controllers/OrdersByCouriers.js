import Order from '../models/Order';
import Courier from '../models/Courier';
import Recipient from '../models/Recipient';

class OrdersByCouriers {
  async index(req, res) {
    const { page = 1 } = req.query;

    if (req.params.id) {
      const courier = await Courier.findOne({ where: { id: req.params.id } });
      if (!courier) return res.status(400).json({ error: 'Courier not found' });

      const orders = await Order.findAll({
        where: {
          courier_id: req.params.id,
          canceled_at: null,
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

      if (req.query.end_date) {
        const OrdersWithEndDate = orders.filter(order => {
          return order.end_date;
        });

        return res.json(OrdersWithEndDate);
      }
      const OrdersWithOutEndDate = orders.filter(order => {
        return !order.end_date;
      });

      return res.json(OrdersWithOutEndDate);
    }

    return res.status(400).json({ error: 'Request without Courier ID' });
  }
}

export default new OrdersByCouriers();
