import * as Yup from 'yup';
import { Op } from 'sequelize';

import Courier from '../models/Courier';
import File from '../models/File';

class CourierController {
  async index(req, res) {
    const { page = 1 } = req.query;

    if (req.query.name) {
      const couriers = await Courier.findAll({
        where: {
          name: {
            [Op.iRegexp]: req.query.name,
          },
        },
        order: ['id'],
        limit: 8,
        offset: (page - 1) * 8,
      });
      return res.json(couriers);
    }

    const couriers = await Courier.findAll({
      order: ['id'],
      limit: 8,
      offset: (page - 1) * 8,
    });
    return res.json(couriers);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      avatar_id: Yup.number().required(),
      email: Yup.string()
        .email()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const courierExists = await Courier.findOne({
      where: { email: req.body.email },
    });

    if (courierExists) {
      return res.status(400).json({ error: 'Courier already exist' });
    }

    const fileExists = await File.findOne({
      where: { id: req.body.avatar_id },
    });

    if (!fileExists) {
      return res.status(400).json({ error: 'File not exist' });
    }

    const { id, name, avatar_id, email } = await Courier.create(req.body);

    return res.json({ id, name, avatar_id, email });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      avatar_id: Yup.number(),
      email: Yup.string().email(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const courier = await Courier.findOne({
      where: { id: req.params.id },
    });

    if (req.body.email !== courier.email) {
      const courierExists = await Courier.findOne({
        where: { email: req.body.email },
      });

      if (courierExists) {
        return res.status(400).json({ error: 'Courier already exist' });
      }
    }

    const fileExists = await File.findOne({
      where: { id: req.body.avatar_id },
    });

    if (!fileExists) {
      return res.status(400).json({ error: 'File not exist' });
    }

    const { id, name, avatar_id, email } = await courier.update(req.body);

    return res.json({ id, name, avatar_id, email });
  }

  async delete(req, res) {
    const courier = await Courier.findByPk(req.params.id);

    try {
      await courier.destroy();
      return res.json({ succes: 'Courier deleted' });
    } catch (error) {
      return res.json(error);
    }
  }
}

export default new CourierController();
