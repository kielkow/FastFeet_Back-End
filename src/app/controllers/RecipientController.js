import Recipient from '../models/Recipient';
import User from '../models/User';

class RecipientController {
  async store(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.params.id },
    });

    if (!checkUserProvider)
      return res.status(400).json({ error: 'User not exist' });

    if (!checkUserProvider.provider)
      return res.status(400).json({ error: 'User is not a provider' });

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
      street,
      number,
      details,
      state,
      city,
      cep,
    } = await Recipient.create(req.body);

    return res.json({ id, name, street, number, details, state, city, cep });
  }
}

export default new RecipientController();
