import * as Yup from 'yup';

import { Op } from 'sequelize';

import Recipient from '../models/Recipient';
import User from '../models/User';
import File from '../models/File';

class RecipientController {
  async index(req, res) {
    const { page = 1 } = req.query;

    if (req.query.name) {
      const recipients = await Recipient.findAll({
        where: {
          name: {
            [Op.iRegexp]: req.query.name,
          },
        },
        include: [
          {
            model: File,
            as: 'signature',
            attributes: ['id', 'path', 'url'],
          },
        ],
        order: ['id'],
        limit: 8,
        offset: (page - 1) * 8,
      });
      return res.json(recipients);
    }

    const recipients = await Recipient.findAll({
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
      ],
      order: ['id'],
      limit: 8,
      offset: (page - 1) * 8,
    });
    return res.json(recipients);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      signature_id: Yup.number().required(),
      street: Yup.string().required(),
      number: Yup.string().required(),
      details: Yup.string().required(),
      state: Yup.string().required(),
      city: Yup.string().required(),
      cep: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const checkUserProvider = await User.findOne({
      where: { id: req.params.id },
    });

    if (!checkUserProvider)
      return res.status(400).json({ error: 'User not exist' });

    if (!checkUserProvider.provider)
      return res.status(400).json({ error: 'User is not a provider' });

    const fileExists = await File.findOne({
      where: { id: req.body.signature_id },
    });

    if (!fileExists) {
      return res.status(400).json({ error: 'File not exist' });
    }

    const recipientExists = await Recipient.findOne({
      where: {
        name: req.body.name,
        street: req.body.street,
        number: req.body.number,
        details: req.body.details,
        state: req.body.state,
        city: req.body.city,
        cep: req.body.cep,
      },
    });

    if (recipientExists) {
      return res.status(400).json({ error: 'Recipient already exist' });
    }

    const {
      id,
      name,
      signature_id,
      street,
      number,
      details,
      state,
      city,
      cep,
    } = await Recipient.create(req.body);

    return res.json({
      id,
      name,
      signature_id,
      street,
      number,
      details,
      state,
      city,
      cep,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      signature_id: Yup.number(),
      street: Yup.string().required(),
      number: Yup.string().required(),
      details: Yup.string().required(),
      state: Yup.string().required(),
      city: Yup.string().required(),
      cep: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const recipient = await Recipient.findOne({
      where: { id: req.params.id },
    });

    if (req.body.signature_id) {
      const fileExists = await File.findOne({
        where: { id: req.body.signature_id },
      });

      if (!fileExists) {
        return res.status(400).json({ error: 'File not exist' });
      }
    }

    const recipientExists = await Recipient.findOne({
      where: {
        name: req.body.name,
        street: req.body.street,
        number: req.body.number,
        details: req.body.details,
        state: req.body.state,
        city: req.body.city,
        cep: req.body.cep,
      },
    });

    if (recipientExists) {
      return res.status(400).json({ error: 'Recipient already exist' });
    }

    const {
      id,
      name,
      signature_id,
      street,
      number,
      details,
      state,
      city,
      cep,
    } = await recipient.update(req.body);

    return res.json({
      id,
      name,
      signature_id,
      street,
      number,
      details,
      state,
      city,
      cep,
    });
  }

  async delete(req, res) {
    const recipient = await Recipient.findByPk(req.params.id);

    try {
      await recipient.destroy();
      return res.json({ succes: 'Recipient deleted' });
    } catch (error) {
      return res.json(error);
    }
  }
}

export default new RecipientController();
