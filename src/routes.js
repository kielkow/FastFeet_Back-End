import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.post('/users', async (req, res) => {
  const user = await User.create({
    name: 'kielkow',
    email: 'matheuskiel@fiorifer.com.br',
    password_hash: '123456',
    provider: true,
  });

  return res.json(user);
});
export default routes;
