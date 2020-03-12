/* eslint-disable no-console */
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { order } = data;

    console.log('Fila CancellationMail executada');

    await Mail.sendMail({
      to: `${order.courier.name} <${order.courier.email}>`,
      subject: 'Encomenda cancelada',
      template: 'cancellation',
      context: {
        courier: order.courier.name,
        recipient: order.recipient.name,
        date: format(
          parseISO(order.start_date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new CancellationMail();
