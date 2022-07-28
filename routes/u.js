let express = require('express');
let router = express.Router();
const functions = require('../lib/functions');
const data = require('../data/markets');
const crypto = require('crypto');
const client = require('../lib/mongodb');

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  try {
    await client.connect();
    const usersCollection = await client.db('test').collection('users');
    const thisUser = await usersCollection.findOne({
      username,
    });
    if (thisUser)
      return res.status(500).json({ message: 'Ese usuario ya existe!' });
    await usersCollection.insertOne({
      username,
      hashed_pw: hash,
    });
    return res
      .status(200)
      .json({ message: 'El usuario fue agregado a la base de datos' });
  } catch (error) {
    console.log('Hubo un error', error);
    return res
      .status(500)
      .json({ message: 'Hubo un error al agregar el nuevo usuario' });
  } finally {
    client.close();
  }
});

router.get('/:username/alertas', async (req, res) => {
  try {
    await client.connect();
    const thisUser = await client.db('test').collection('users').findOne({
      username: req.params.username,
    });
    if (thisUser) {
      console.log('this user is: ', thisUser);
      res
        .status(200)
        .json({ message: 'El usuario está, y acá va: ', user: thisUser });
    } else {
      res.status(401).json({ message: 'Ese usuario no existe' });
    }
  } catch (error) {
    console.log('There was an error', error);
    res.status(500).json({ message: 'Hubo un error recuperando al usuario' });
  } finally {
    await client.close();
  }
});

router.post('/:username/alertas', async (req, res) => {
  let markets = req.app.get('markets');
  if (!markets.includes(req.body.marketid.toUpperCase()))
    return res.status(401).json({ message: 'Ese mercado no está disponible.' });
  try {
    await client.connect();
    const usersCollection = await client.db('test').collection('users');
    const thisUser = await usersCollection.findOne({
      username: req.params.username,
    });

    const newAlert = {
      username: req.params.username,
      market: req.body.marketid,
      triggering: req.body.triggering,
      priceComparer: req.body.priceComparer,
      prize_alert: req.body.prize_alert,
      triggered: [],
      timestamp: new Date().getTime(),
      _id: crypto.randomBytes(8).toString('hex'),
    };
    let updatedMessage, message;
    if (thisUser) {
      const hashed_pw_query = crypto
        .createHash('sha256')
        .update(req.body.password)
        .digest('hex');
      if (thisUser.hashed_pw && thisUser.hashed_pw !== hashed_pw_query)
        res
          .status(401)
          .json({ message: 'No estás autorizado para realizar esta acción' });
      if (thisUser.alerts?.length === 0) {
        updatedMessage = await usersCollection.updateOne(
          {
            username: req.params.username,
          },
          { $set: { alerts: [newAlert] } }
        );
        if (updatedMessage.acknowledged)
          message = 'La primera alerta para este usuario fue creada.';
      } else {
        updatedMessage = await usersCollection.updateOne(
          {
            username: req.params.username,
          },
          { $push: { alerts: newAlert } }
        );
        if (updatedMessage.acknowledged)
          message = 'Se agregó esta alerta al usuario';
      }
    } else {
      updatedMessage = await usersCollection.insertOne({
        hashed_pw: crypto
          .createHash('sha256')
          .update(req.body.password)
          .digest('hex'),
        username: req.params.username,
        alerts: [newAlert],
      });
      if (updatedMessage.acknowledged)
        message = 'El usuario fue creado con la nueva alerta disponible';
    }
    if (newAlert.triggering) {
      const triggeringAlertsCollection = await client
        .db('test')
        .collection('alerts');
      await triggeringAlertsCollection.insertOne({
        ...newAlert,
        username: req.params.username,
      });
    }
    addNewAlert(newAlert);
    res.json({ message });
  } catch (error) {
    console.log('There was an error', error);
    res.status(500).json({ message: 'There was an error' });
  } finally {
    await client.close();
  }
});

const addNewAlert = async newAlert => {
  await client.connect();
  const dbresponse = await client
    .db('test')
    .collection('alerts')
    .insertOne(newAlert);
};

module.exports = router;
