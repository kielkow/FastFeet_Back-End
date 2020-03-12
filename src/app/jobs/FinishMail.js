/* eslint-disable no-console */
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class FinishMail {
  get key() {
    return 'FinishMail';
  }

  async handle({ data }) {
    const { order } = data;

    console.log('Fila FinishMail executada');

    await Mail.sendMail({
      to: `${order.courier.name} <${order.courier.email}>`,
      subject: 'Data final de envio confirmada',
      template: 'enddate',
      context: {
        courier: order.courier.name,
        courierId: order.courier.id,
        recipient: order.recipient.name,
        start_date: format(
          parseISO(order.start_date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
        end_date: format(
          parseISO(order.end_date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
        street: order.recipient.street,
        number: order.recipient.number,
        details: order.recipient.details,
        state: order.recipient.state,
        city: order.recipient.city,
        cep: order.recipient.cep,
      },
    });
  }
}

export default new FinishMail();
