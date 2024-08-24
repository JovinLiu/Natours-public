const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../Models/bookingModel');
const Tour = require('../Models/tourModel');
const User = require('../Models/userModel');
const catchAsync = require('../utils/catchAsync');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    //unsecure way, will be changed when deployed
    // success_url: `${req.protocol}://${req.get('host')}/tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/me/bookings?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'aud',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
    mode: 'payment',
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

// This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { user, tour, price } = req.query;

//   if (!user || !tour || !price) return next();

//   await Booking.create({ user, tour, price });

//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  console.log(session);
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].price_data.unit_amount / 100;
  await Booking.create({ user, tour, price });
};

exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    //req.body是raw form
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
});

exports.getAllBookings = getAll(Booking);
exports.getBooking = getOne(Booking);
exports.createBooking = createOne(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);
