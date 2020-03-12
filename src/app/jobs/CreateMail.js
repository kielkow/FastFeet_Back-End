/* eslint-disable no-console */
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CreateMail {
  get key() {
    return 'CreateMail';
  }

  async handle({ data }) {
    const { order, courierExists, recipientExists } = data;

    console.log('Fila CreateMail executada');

    await Mail.sendMail({
      to: `${courierExists.name} <${courierExists.email}>`,
      subject: 'Encomenda disponível para retirada',
      template: 'confirmation',
      context: {
        courier: courierExists.name,
        recipient: recipientExists.name,
        date: format(
          parseISO(order.start_date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
        street: recipientExists.street,
        number: recipientExists.number,
        details: recipientExists.details,
        state: recipientExists.state,
        city: recipientExists.city,
        cep: recipientExists.cep,
      },
    });
  }
}

export default new CreateMail();
